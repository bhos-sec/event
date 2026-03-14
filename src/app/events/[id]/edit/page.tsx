"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((event) => {
        setForm({
          name: event.name || "",
          description: event.description || "",
          location: event.location || "",
          category: event.category || "",
          startDate: event.startDate
            ? new Date(event.startDate).toISOString().slice(0, 16)
            : "",
          endDate: event.endDate
            ? new Date(event.endDate).toISOString().slice(0, 16)
            : "",
          maxParticipants: event.maxParticipants?.toString() || "",
          registrationDeadline: event.registrationDeadline
            ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
            : "",
          status: event.status || "draft",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants, 10) : null,
          registrationDeadline: form.registrationDeadline || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      router.push(`/events/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/events/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← Back to event
        </Link>
        <h1 className="font-mono text-2xl font-bold text-[var(--foreground)]">Edit Event</h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
              Event Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
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
              <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
                Start Date *
              </label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                required
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
                End Date
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
              Max Participants (optional)
            </label>
            <input
              type="number"
              min="1"
              value={form.maxParticipants}
              onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
              Registration Deadline
            </label>
            <input
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(e) => setForm((f) => ({ ...f, registrationDeadline: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">Leave empty for no deadline</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-mono text-[var(--muted)]">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[var(--accent)] py-3 font-mono font-medium text-[var(--background)] hover:bg-[var(--accent-dim)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </main>
    </div>
  );
}
