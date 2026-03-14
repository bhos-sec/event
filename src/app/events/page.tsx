"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  category: string | null;
  startDate: string;
  endDate: string | null;
  maxParticipants: number | null;
  status: string;
  _count: { participants: number; checkIns: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/events?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, statusFilter]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-mono text-3xl font-bold text-[var(--foreground)]">Events</h1>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-dim)]"
          >
            <span className="font-mono">+</span> Create Event
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-2 font-mono text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="mt-4 text-[var(--muted)]">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-12 text-center">
            <p className="text-[var(--muted)]">No events found.</p>
            <Link
              href="/events/new"
              className="mt-4 inline-block text-[var(--accent)] hover:text-[var(--accent-dim)]"
            >
              Create your first event →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-6 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface-hover)]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)]">
                    {event.name}
                  </h2>
                  <StatusBadge status={event.status} />
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-[var(--muted)]">
                  {event.description || "No description"}
                </p>
                <div className="flex gap-4 text-xs text-[var(--muted)]">
                  <span>{event._count.participants} registered</span>
                  <span>{event._count.checkIns} checked in</span>
                </div>
                <p className="mt-2 font-mono text-xs text-[var(--accent)]">
                  {new Date(event.startDate).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "bg-[var(--surface-hover)] text-[var(--muted)]",
    published: "bg-emerald-500/20 text-emerald-600",
    cancelled: "bg-red-500/20 text-red-500",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-mono capitalize ${styles[status] || styles.draft}`}
    >
      {status}
    </span>
  );
}
