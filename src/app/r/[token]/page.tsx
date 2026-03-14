"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

type Registration = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  registeredAt: string;
  event: { id: string; name: string; startDate: string; location: string | null };
  checkedIn: boolean;
};

export default function ParticipantSelfServicePage() {
  const params = useParams();
  const token = params.token as string;
  const [reg, setReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [saveLoading, setSaveLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/r/${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) throw new Error("Registration not found");
        return r.json();
      })
      .then(setReg)
      .catch(() => setError("Registration not found"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (reg) setEditForm({ name: reg.name, phone: reg.phone || "" });
  }, [reg]);

  async function handleSave() {
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/r/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Update failed");
      const data = await res.json();
      setReg((prev) =>
        prev ? { ...prev, name: data.name, phone: data.phone } : null
      );
      setEditing(false);
    } catch {
      setError("Failed to update");
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!reg?.checkedIn || feedbackRating < 1) return;
    setFeedbackLoading(true);
    try {
      const res = await fetch(`/api/events/${reg.event.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: reg.id,
          rating: feedbackRating,
          comment: feedbackComment || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setFeedbackSubmitted(true);
    } catch {
      setError("Failed to submit feedback");
    } finally {
      setFeedbackLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel your registration?")) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/r/${encodeURIComponent(token)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Cancel failed");
      setCancelled(true);
    } catch {
      setError("Failed to cancel");
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error && !reg) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Nav />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-red-400">{error}</p>
          <Link href="/events" className="mt-4 inline-block text-[var(--accent)] hover:underline">
            Browse events
          </Link>
        </main>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Nav />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] p-8">
            <p className="text-lg text-emerald-600">Registration cancelled</p>
            <p className="mt-2 text-[var(--muted)]">
              Your spot has been released. Someone from the waitlist may have been promoted.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-block text-[var(--accent)] hover:underline"
            >
              Browse events
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!reg) return null;

  const startDate = new Date(reg.event.startDate);
  const qrUrl = `/participants/${reg.id}/qr`;
  const checkInUrl = `/check-in/${reg.event.id}?token=${token}`;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] p-6">
          <h1 className="font-mono text-xl font-bold text-[var(--foreground)]">{reg.event.name}</h1>
          <p className="mt-1 text-[var(--muted)]">
            {startDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {reg.event.location && (
            <p className="mt-1 text-[var(--muted)]">📍 {reg.event.location}</p>
          )}

          <div className="mt-6 space-y-4">
            {editing ? (
              <>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Name"
                  className="w-full rounded border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)]"
                />
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone"
                  className="w-full rounded border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-dim)] disabled:opacity-50"
                  >
                    {saveLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded bg-[var(--surface-hover)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--border)] border border-[var(--border)]"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-[var(--muted)]">Name</p>
                  <p className="text-[var(--foreground)]">{reg.name}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Email</p>
                  <p className="text-[var(--foreground)]">{reg.email}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">Phone</p>
                  <p className="text-[var(--foreground)]">{reg.phone || "—"}</p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  Edit details
                </button>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={qrUrl}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 font-medium text-[var(--background)] hover:bg-[var(--accent-dim)]"
            >
              View / Download QR Code
            </Link>
            <a
              href={checkInUrl}
              className="inline-block text-center text-sm text-[var(--muted)] hover:text-[var(--accent)]"
            >
              Open check-in link
            </a>
          </div>

          {reg.checkedIn && !feedbackSubmitted && (
            <form onSubmit={handleFeedback} className="mt-6 rounded-lg border border-slate-800 bg-slate-800/30 p-4">
              <h3 className="mb-3 font-mono text-sm font-medium text-slate-400">
                Leave feedback
              </h3>
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFeedbackRating(r)}
                    className={`rounded px-2 py-1 text-lg ${feedbackRating >= r ? "text-amber-400" : "text-slate-500 hover:text-slate-400"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Comment (optional)"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={2}
                className="mb-3 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={feedbackLoading || feedbackRating < 1}
                className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {feedbackLoading ? "..." : "Submit feedback"}
              </button>
            </form>
          )}

          {feedbackSubmitted && (
            <p className="mt-4 text-emerald-400">Thank you for your feedback!</p>
          )}

          <div className="mt-6 border-t border-slate-800 pt-4">
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="text-sm text-red-400 hover:underline disabled:opacity-50"
            >
              {cancelLoading ? "Cancelling..." : "Cancel my registration"}
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Keep this link private. It allows you to manage your registration.
        </p>
      </main>
    </div>
  );
}
