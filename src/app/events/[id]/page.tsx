"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";

type Event = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  maxParticipants: number | null;
  _count: { participants: number; checkIns: number };
};

type Participant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  registeredAt: string;
  _count: { checkIns: number };
};

export default function EventDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [analytics, setAnalytics] = useState<{
    summary: { totalParticipants: number; totalCheckIns: number; attendanceRate: number; noShow: number };
    checkInsByHour: { hour: number; count: number }[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"participants" | "analytics">("participants");
  const [loading, setLoading] = useState(true);
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventRes, participantsRes, analyticsRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch(`/api/events/${id}/participants`),
          fetch(`/api/events/${id}/analytics`),
        ]);
        if (eventRes.ok) setEvent(await eventRes.json());
        if (participantsRes.ok) setParticipants(await participantsRes.json());
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setParticipants((p) => [data, ...p]);
      setRegForm({ name: "", email: "", phone: "" });
      if (analytics) {
        setAnalytics((a) =>
          a
            ? {
                ...a,
                summary: {
                  ...a.summary,
                  totalParticipants: a.summary.totalParticipants + 1,
                },
              }
            : null
        );
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const isFull = event.maxParticipants ? event._count.participants >= event.maxParticipants : false;

  return (
    <div className="min-h-screen bg-slate-950">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/events"
              className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"
            >
              ← Back to events
            </Link>
            <h1 className="font-mono text-3xl font-bold text-white">{event.name}</h1>
            <p className="mt-2 text-slate-400">
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
              <p className="mt-1 text-slate-500">📍 {event.location}</p>
            )}
            {event.description && (
              <p className="mt-3 text-slate-400">{event.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/check-in/${id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 font-mono text-sm font-medium text-cyan-400 ring-1 ring-cyan-500/50 hover:bg-cyan-500/30"
            >
              📱 QR Check-in
            </Link>
            <Link
              href={`/events/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 font-mono text-sm text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
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

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <div className="mb-6 flex gap-4 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveTab("participants")}
              className={`font-mono text-sm font-medium ${
                activeTab === "participants"
                  ? "text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Participants
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`font-mono text-sm font-medium ${
                activeTab === "analytics"
                  ? "text-cyan-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Analytics
            </button>
          </div>

          {activeTab === "participants" && (
            <div className="space-y-6">
              {!isFull && (
                <form
                  onSubmit={handleRegister}
                  className="flex flex-wrap gap-3 rounded-lg bg-slate-800/50 p-4"
                >
                  <input
                    type="text"
                    placeholder="Name *"
                    value={regForm.name}
                    onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="rounded border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={regForm.email}
                    onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="rounded border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={regForm.phone}
                    onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
                    className="rounded border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="rounded bg-cyan-600 px-4 py-2 font-mono text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
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
                    <tr className="border-b border-slate-700 text-left text-xs text-slate-500">
                      <th className="pb-3 font-mono">Name</th>
                      <th className="pb-3 font-mono">Email</th>
                      <th className="pb-3 font-mono">Status</th>
                      <th className="pb-3 font-mono">QR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-800/50 text-sm text-slate-300"
                      >
                        <td className="py-3 font-medium text-white">{p.name}</td>
                        <td className="py-3">{p.email}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs ${
                              p._count.checkIns > 0
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-700 text-slate-400"
                            }`}
                          >
                            {p._count.checkIns > 0 ? "Checked in" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/participants/${p.id}/qr`}
                            target="_blank"
                            className="text-cyan-400 hover:underline"
                          >
                            View QR
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {participants.length === 0 && (
                  <p className="py-8 text-center text-slate-500">
                    No participants yet. Register above.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "analytics" && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-500">Total Registered</p>
                  <p className="mt-1 font-mono text-2xl text-white">
                    {analytics.summary.totalParticipants}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-500">Checked In</p>
                  <p className="mt-1 font-mono text-2xl text-emerald-400">
                    {analytics.summary.totalCheckIns}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-500">Attendance Rate</p>
                  <p className="mt-1 font-mono text-2xl text-cyan-400">
                    {analytics.summary.attendanceRate}%
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <p className="text-xs text-slate-500">No-show</p>
                  <p className="mt-1 font-mono text-2xl text-amber-400">
                    {analytics.summary.noShow}
                  </p>
                </div>
              </div>
              {analytics.checkInsByHour.length > 0 && (
                <div>
                  <h3 className="mb-3 font-mono text-sm font-medium text-slate-400">
                    Check-ins by hour
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analytics.checkInsByHour.map(({ hour, count }) => (
                      <div
                        key={hour}
                        className="flex items-center gap-2 rounded bg-slate-800 px-3 py-2"
                      >
                        <span className="font-mono text-xs text-slate-500">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                        <span className="font-mono text-sm text-cyan-400">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
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
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-bold text-white">
        {value}
        {max && typeof value === "number" && (
          <span className="ml-1 text-sm font-normal text-slate-500">/ {max}</span>
        )}
      </p>
    </div>
  );
}
