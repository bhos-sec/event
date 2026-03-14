"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Event = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  category: string | null;
  startDate: string;
  endDate: string | null;
  maxParticipants: number | null;
  registrationDeadline: string | null;
  status: string;
  _count: { participants: number; checkIns: number; waitlist?: number };
};

type Participant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  qrToken: string;
  registeredAt: string;
  _count: { checkIns: number };
};

type Feedback = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  participant: { name: string };
};

type WaitlistEntry = { id: string; name: string; email: string; phone: string | null; joinedAt: string };

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [analytics, setAnalytics] = useState<{
    summary: { totalParticipants: number; totalCheckIns: number; attendanceRate: number; noShow: number };
    checkInsByHour: { hour: number; count: number }[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"participants" | "analytics" | "feedback">("participants");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [dupLoading, setDupLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null);
  const [, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCheckInLoading, setBulkCheckInLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState("");
  const [regSuccessToken, setRegSuccessToken] = useState<string | null>(null);

  const fetchParticipants = useCallback(async (search?: string) => {
    const url = search
      ? `/api/events/${id}/participants?search=${encodeURIComponent(search)}`
      : `/api/events/${id}/participants`;
    const res = await fetch(url);
    if (res.ok) setParticipants(await res.json());
  }, [id]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventRes, participantsRes, analyticsRes, waitlistRes, feedbackRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch(`/api/events/${id}/participants`),
          fetch(`/api/events/${id}/analytics`),
          fetch(`/api/events/${id}/waitlist`),
          fetch(`/api/events/${id}/feedback`),
        ]);
        if (eventRes.ok) setEvent(await eventRes.json());
        if (participantsRes.ok) setParticipants(await participantsRes.json());
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        }
        if (waitlistRes.ok) setWaitlist(await waitlistRes.json());
        if (feedbackRes.ok) setFeedback(await feedbackRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const searchInitialized = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (!searchInitialized.current) {
      searchInitialized.current = true;
      return;
    }
    const t = setTimeout(() => fetchParticipants(searchQuery), 300);
    return () => clearTimeout(t);
  }, [id, searchQuery, loading, fetchParticipants]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      if (data.waitlist) {
        setRegSuccess(`${regForm.name} added to waitlist`);
        setWaitlist((w) => [{ id: data.entry.id, name: data.entry.name, email: data.entry.email, phone: data.entry.phone, joinedAt: data.entry.joinedAt }, ...w]);
      } else {
        setParticipants((p) => [data, ...p]);
        if (analytics) {
          setAnalytics((a) =>
            a ? { ...a, summary: { ...a.summary, totalParticipants: a.summary.totalParticipants + 1 } } : null
          );
        }
        if (event) setEvent((e) => e ? { ...e, _count: { ...e._count, participants: e._count.participants + 1 } } : null);
        setRegSuccess("Registered!");
        setRegSuccessToken(data.qrToken || null);
      }
      setRegForm({ name: "", email: "", phone: "" });
      setTimeout(() => {
        setRegSuccess("");
        setRegSuccessToken(null);
      }, 6000);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleDuplicate() {
    setDupLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");
      window.location.href = `/events/${data.id}`;
    } catch (err) {
      console.error(err);
    } finally {
      setDupLoading(false);
    }
  }

  async function handleManualCheckIn(participantId: string) {
    setCheckInLoading(participantId);
    try {
      const res = await fetch(`/api/events/${id}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check-in failed");
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId ? { ...p, _count: { checkIns: 1 } } : p
        )
      );
      setEvent((e) =>
        e ? { ...e, _count: { ...e._count, checkIns: e._count.checkIns + 1 } } : null
      );
      if (analytics) {
        setAnalytics((a) =>
          a
            ? {
                ...a,
                summary: {
                  ...a.summary,
                  totalCheckIns: a.summary.totalCheckIns + 1,
                  noShow: Math.max(0, a.summary.noShow - 1),
                  attendanceRate: Math.round(
                    ((a.summary.totalCheckIns + 1) / a.summary.totalParticipants) * 100
                  ),
                },
              }
            : null
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckInLoading(null);
    }
  }

  async function handleCancelParticipant(participantId: string) {
    if (!confirm("Remove this participant? If event was full, first waitlist entry will be promoted.")) return;
    try {
      const res = await fetch(`/api/participants/${participantId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove");
      setParticipants((p) => p.filter((x) => x.id !== participantId));
      setEvent((e) => e ? { ...e, _count: { ...e._count, participants: e._count.participants - 1 } } : null);
      if (data.promoted) {
        const promoted = await fetch(`/api/events/${id}/participants`).then((r) => r.json());
        setParticipants(promoted);
        setWaitlist((w) => w.filter((x) => x.email !== data.promoted.email));
      }
      if (analytics) {
        const aRes = await fetch(`/api/events/${id}/analytics`);
        if (aRes.ok) setAnalytics(await aRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleBulkCheckIn() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkCheckInLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/check-in/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk check-in failed");
      setSelectedIds(new Set());
      setParticipants((prev) =>
        prev.map((p) =>
          ids.includes(p.id)
            ? { ...p, _count: { checkIns: 1 } }
            : p
        )
      );
      setEvent((e) =>
        e ? { ...e, _count: { ...e._count, checkIns: e._count.checkIns + data.checkedIn } } : null
      );
      if (analytics) {
        const aRes = await fetch(`/api/events/${id}/analytics`);
        if (aRes.ok) setAnalytics(await aRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBulkCheckInLoading(false);
    }
  }

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <div className="flex items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const isFull = event.maxParticipants ? event._count.participants >= event.maxParticipants : false;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/events"
              className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)]"
            >
              ← Back to events
            </Link>
            <h1 className="font-mono text-3xl font-bold text-[var(--foreground)]">{event.name}</h1>
            <p className="mt-2 text-[var(--muted)]">
              {startDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {event.location && (
              <p className="mt-1 text-[var(--muted)]">📍 {event.location}</p>
            )}
            {event.description && (
              <p className="mt-3 text-[var(--muted)]">{event.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <span
              className={`inline-flex rounded px-2 py-1 text-xs font-mono uppercase ${
                event.status === "published"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : event.status === "cancelled"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-[var(--surface-hover)] text-[var(--muted)]"
              }`}
            >
              {event.status}
            </span>
            <Link
              href={`/check-in/${id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)]/20 px-4 py-2 font-mono text-sm font-medium text-[var(--accent)] ring-1 ring-[var(--accent)]/50 hover:bg-[var(--accent)]/30"
            >
              📱 QR Check-in
            </Link>
            <a
              href={`/api/events/${id}/calendar`}
              download={`${event.name.replace(/[^a-z0-9]/gi, "_")}.ics`}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--surface-hover)] px-4 py-2 font-mono text-sm text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--border)]"
            >
              📅 Add to Calendar
            </a>
            <a
              href={`/api/events/${id}/participants/export?format=csv`}
              download
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--surface-hover)] px-4 py-2 font-mono text-sm text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--border)]"
            >
              📥 Export CSV
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print inline-flex items-center gap-2 rounded-lg bg-[var(--surface-hover)] px-4 py-2 font-mono text-sm text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--border)]"
            >
              🖨️ Print
            </button>
            <button
              onClick={handleDuplicate}
              disabled={dupLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--surface-hover)] px-4 py-2 font-mono text-sm text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--border)] disabled:opacity-50"
            >
              {dupLoading ? "..." : "📋 Duplicate"}
            </button>
            <Link
              href={`/events/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--surface-hover)] px-4 py-2 font-mono text-sm text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--border)]"
            >
              Edit Event
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Registered"
            value={event._count.participants}
            max={event.maxParticipants}
          />
          <StatCard label="Checked In" value={event._count.checkIns} />
          <StatCard
            label="Attendance"
            value={
              event._count.participants > 0
                ? `${Math.round((event._count.checkIns / event._count.participants) * 100)}%`
                : "0%"
            }
          />
          <StatCard label="Capacity" value={isFull ? "Full" : "Open"} />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-6">
          <div className="mb-6 flex flex-wrap gap-4 border-b border-[var(--border)] pb-4">
            <button
              onClick={() => setActiveTab("participants")}
              className={`font-mono text-sm font-medium ${
                activeTab === "participants"
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Participants
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`font-mono text-sm font-medium ${
                activeTab === "analytics"
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`font-mono text-sm font-medium ${
                activeTab === "feedback"
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Feedback
            </button>
          </div>

          {activeTab === "participants" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="search"
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs rounded border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkCheckIn}
                    disabled={bulkCheckInLoading}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {bulkCheckInLoading ? "..." : `Check in ${selectedIds.size} selected`}
                  </button>
                )}
              </div>
              {regSuccess && (
                <p className="rounded bg-emerald-500/20 px-3 py-2 text-sm text-emerald-400">
                  {regSuccess}{" "}
                  {regSuccessToken && (
                    <Link
                      href={`/r/${regSuccessToken}`}
                      className="font-medium underline hover:no-underline"
                    >
                      Manage your registration
                    </Link>
                  )}
                </p>
              )}
              {!isFull && (
                <form
                  onSubmit={handleRegister}
                  className="flex flex-wrap gap-3 rounded-lg bg-[var(--surface-hover)] p-4"
                >
                  <input
                    type="text"
                    placeholder="Name *"
                    value={regForm.name}
                    onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="rounded border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={regForm.email}
                    onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="rounded border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={regForm.phone}
                    onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
                    className="rounded border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="rounded bg-[var(--accent)] px-4 py-2 font-mono text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-dim)] disabled:opacity-50"
                  >
                    {regLoading ? "..." : "Register"}
                  </button>
                  {regError && (
                    <p className="w-full text-sm text-red-400">{regError}</p>
                  )}
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                      <th className="pb-3 pr-2">
                        <input
                          type="checkbox"
                          checked={
                            (() => {
                              const pending = participants.filter((p) => p._count.checkIns === 0);
                              return pending.length > 0 && pending.every((p) => selectedIds.has(p.id));
                            })()
                          }
                          onChange={(e) => {
                            const pending = participants.filter((p) => p._count.checkIns === 0);
                            setSelectedIds(e.target.checked ? new Set(pending.map((p) => p.id)) : new Set());
                          }}
                          className="rounded border-[var(--border)]"
                        />
                      </th>
                      <th className="pb-3 font-mono">Name</th>
                      <th className="pb-3 font-mono">Email</th>
                      <th className="pb-3 font-mono">Status</th>
                      <th className="pb-3 font-mono">QR</th>
                      <th className="pb-3 font-mono">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[var(--border)] text-sm text-[var(--foreground)]"
                      >
                        <td className="py-3 pr-2">
                          {p._count.checkIns === 0 && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(p.id)}
                              onChange={(e) => {
                                setSelectedIds((s) => {
                                  const next = new Set(s);
                                  if (e.target.checked) next.add(p.id);
                                  else next.delete(p.id);
                                  return next;
                                });
                              }}
                              className="rounded border-[var(--border)]"
                            />
                          )}
                        </td>
                        <td className="py-3 font-medium text-[var(--foreground)]">{p.name}</td>
                        <td className="py-3">{p.email}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs ${
                              p._count.checkIns > 0
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-[var(--surface-hover)] text-[var(--muted)]"
                            }`}
                          >
                            {p._count.checkIns > 0 ? "Checked in" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/participants/${p.id}/qr`}
                            target="_blank"
                            className="text-[var(--accent)] hover:underline"
                          >
                            View QR
                          </Link>
                          {p.qrToken && (
                            <>
                              {" · "}
                              <Link
                                href={`/r/${p.qrToken}`}
                                target="_blank"
                                className="text-[var(--muted)] hover:text-[var(--accent)]"
                              >
                                Manage
                              </Link>
                            </>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {p._count.checkIns > 0 ? (
                              <span className="text-[var(--muted)] text-xs">—</span>
                            ) : (
                              <button
                                onClick={() => handleManualCheckIn(p.id)}
                                disabled={checkInLoading === p.id}
                                className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                              >
                                {checkInLoading === p.id ? "..." : "Check In"}
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelParticipant(p.id)}
                              className="rounded bg-red-600/50 px-2 py-1 text-xs text-red-300 hover:bg-red-600/70"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {participants.length === 0 && (
                  <p className="py-8 text-center text-[var(--muted)]">
                    No participants yet. Register above.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "analytics" && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-[var(--surface-hover)] p-4">
                  <p className="text-xs text-[var(--muted)]">Total Registered</p>
                  <p className="mt-1 font-mono text-2xl text-[var(--foreground)]">
                    {analytics.summary.totalParticipants}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--surface-hover)] p-4">
                  <p className="text-xs text-[var(--muted)]">Checked In</p>
                  <p className="mt-1 font-mono text-2xl text-emerald-400">
                    {analytics.summary.totalCheckIns}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--surface-hover)] p-4">
                  <p className="text-xs text-[var(--muted)]">Attendance Rate</p>
                  <p className="mt-1 font-mono text-2xl text-[var(--accent)]">
                    {analytics.summary.attendanceRate}%
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--surface-hover)] p-4">
                  <p className="text-xs text-[var(--muted)]">No-show</p>
                  <p className="mt-1 font-mono text-2xl text-amber-400">
                    {analytics.summary.noShow}
                  </p>
                </div>
              </div>
              {analytics.checkInsByHour.length > 0 && (
                <div>
                  <h3 className="mb-3 font-mono text-sm font-medium text-[var(--muted)]">
                    Check-ins by hour
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analytics.checkInsByHour.map(({ hour, count }) => (
                      <div
                        key={hour}
                        className="flex items-center gap-2 rounded bg-[var(--surface-hover)] px-3 py-2"
                      >
                        <span className="font-mono text-xs text-[var(--muted)]">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                        <span className="font-mono text-sm text-[var(--accent)]">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "feedback" && (
            <FeedbackTab
              eventId={id}
              participants={participants}
              feedback={feedback}
              onFeedbackChange={() =>
                fetch(`/api/events/${id}/feedback`)
                  .then((r) => r.json())
                  .then(setFeedback)
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}

function FeedbackTab({
  eventId,
  participants,
  feedback,
  onFeedbackChange,
}: {
  eventId: string;
  participants: Participant[];
  feedback: Feedback[];
  onFeedbackChange: () => void;
}) {
  const checkedIn = participants.filter((p) => p._count.checkIns > 0);
  const [selectedId, setSelectedId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || rating < 1) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: selectedId, rating, comment }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSelectedId("");
      setRating(0);
      setComment("");
      onFeedbackChange();
    } catch {
      console.error("Feedback submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {avgRating && (
        <div className="rounded-lg bg-[var(--surface-hover)] p-4">
          <p className="text-xs text-[var(--muted)]">Average rating</p>
          <p className="font-mono text-2xl text-[var(--accent)]">⭐ {avgRating} / 5</p>
        </div>
      )}
      {checkedIn.length > 0 && (
        <form onSubmit={handleSubmit} className="rounded-lg bg-[var(--surface-hover)] p-4">
          <h3 className="mb-3 font-mono text-sm font-medium text-[var(--muted)]">
            Submit feedback (checked-in participants only)
          </h3>
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              className="rounded border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 text-sm text-[var(--foreground)]"
            >
              <option value="">Select participant</option>
              {checkedIn.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--muted)]">Rating:</span>
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  className={`rounded px-2 py-1 text-sm ${rating >= r ? "text-amber-500" : "text-[var(--muted)]"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-w-[200px] rounded border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted)]"
            />
            <button
              type="submit"
              disabled={submitting || !selectedId || rating < 1}
              className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-dim)] disabled:opacity-50"
            >
              {submitting ? "..." : "Submit"}
            </button>
          </div>
        </form>
      )}
      <div>
        <h3 className="mb-3 font-mono text-sm font-medium text-[var(--muted)]">
          Feedback ({feedback.length})
        </h3>
        {feedback.length === 0 ? (
          <p className="text-[var(--muted)]">No feedback yet.</p>
        ) : (
          <div className="space-y-3">
            {feedback.map((f) => (
              <div
                key={f.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[var(--foreground)]">{f.participant.name}</span>
                  <span className="text-amber-400">{"★".repeat(f.rating)}</span>
                </div>
                {f.comment && (
                  <p className="mt-2 text-sm text-[var(--muted)]">{f.comment}</p>
                )}
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {new Date(f.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  max,
}: {
  label: string;
  value: string | number;
  max?: number | null;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold text-[var(--foreground)]">
        {value}
        {max && typeof value === "number" && (
          <span className="ml-1 text-sm font-normal text-[var(--muted)]">/ {max}</span>
        )}
      </p>
    </div>
  );
}
