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
          <h1 className="font-mono text-3xl font-bold text-white">Events</h1>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900 transition-colors hover:bg-cyan-400"
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
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 font-mono text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <p className="mt-4 text-slate-400">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
            <p className="text-slate-400">No events found.</p>
            <Link
              href="/events/new"
              className="mt-4 inline-block text-cyan-400 hover:text-cyan-300"
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
                className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 transition-all hover:border-cyan-500/50 hover:bg-slate-800/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold text-white group-hover:text-cyan-400">
                    {event.name}
                  </h2>
                  <StatusBadge status={event.status} />
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-slate-400">
                  {event.description || "No description"}
                </p>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>{event._count.participants} registered</span>
                  <span>{event._count.checkIns} checked in</span>
                </div>
                <p className="mt-2 font-mono text-xs text-cyan-500/80">
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
    draft: "bg-slate-600/50 text-slate-300",
    published: "bg-emerald-500/20 text-emerald-400",
    cancelled: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-mono capitalize ${styles[status] || styles.draft}`}
    >
      {status}
    </span>
  );
}
