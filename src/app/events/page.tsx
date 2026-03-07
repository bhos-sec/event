"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  maxParticipants: number | null;
  _count: { participants: number; checkIns: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

        {loading ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <p className="mt-4 text-slate-400">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
            <p className="text-slate-400">No events yet.</p>
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
                <h2 className="mb-2 font-semibold text-white group-hover:text-cyan-400">
                  {event.name}
                </h2>
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
