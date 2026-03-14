"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function NewEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    category: "",
    startDate: "",
    endDate: "",
    maxParticipants: "",
    registrationDeadline: "",
    status: "draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          location: form.location || null,
          category: form.category || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants, 10) : null,
          registrationDeadline: form.registrationDeadline || null,
          status: form.status,
          createdByUid: user?.uid,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");
      router.push(`/events/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <span className="font-mono">←</span> Back to events
        </Link>

        <h1 className="mb-8 font-mono text-3xl font-bold text-[var(--foreground)]">Create Event</h1>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-6"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="Tech Talk: AI in 2025"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="Brief description of the event..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="Room 101, Main Building"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">Select category</option>
                <option value="workshop">Workshop</option>
                <option value="meetup">Meetup</option>
                <option value="hackathon">Hackathon</option>
                <option value="talk">Talk</option>
                <option value="social">Social</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Max Participants
              </label>
              <input
                type="number"
                min="1"
                value={form.maxParticipants}
                onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="Unlimited"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Registration Deadline
              </label>
              <input
                type="datetime-local"
                value={form.registrationDeadline}
                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <p className="mt-1 text-xs text-[var(--muted)]">Leave empty for no deadline</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-dim)] disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
            <Link
              href="/events"
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
