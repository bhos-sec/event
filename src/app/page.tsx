"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-mono text-5xl font-bold tracking-tight text-white md:text-6xl">
            BHOS Event Manager
          </h1>
          <p className="mx-auto max-w-2xl font-sans text-lg text-slate-400">
            Create events, register participants, QR check-in, and track attendance analytics.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/events"
            className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 transition-all hover:border-cyan-500/50 hover:bg-slate-800/50"
          >
            <div className="mb-3 font-mono text-2xl text-cyan-400">/events</div>
            <h2 className="mb-2 font-semibold text-white">Manage Events</h2>
            <p className="text-sm text-slate-400">
              Create, edit, and organize club events with full details.
            </p>
          </Link>

          <Link
            href="/events"
            className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 transition-all hover:border-cyan-500/50 hover:bg-slate-800/50"
          >
            <div className="mb-3 font-mono text-2xl text-cyan-400">/register</div>
            <h2 className="mb-2 font-semibold text-white">Participant Registration</h2>
            <p className="text-sm text-slate-400">
              Register attendees and generate unique QR codes for check-in.
            </p>
          </Link>

          <Link
            href="/events"
            className="group rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 transition-all hover:border-cyan-500/50 hover:bg-slate-800/50"
          >
            <div className="mb-3 font-mono text-2xl text-cyan-400">/analytics</div>
            <h2 className="mb-2 font-semibold text-white">Attendance Analytics</h2>
            <p className="text-sm text-slate-400">
              Real-time attendance rates and check-in insights.
            </p>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-medium text-slate-900 transition-colors hover:bg-cyan-400"
          >
            View All Events
            <span className="font-mono">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
