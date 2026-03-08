"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-mono text-5xl font-bold tracking-tight text-[var(--foreground)] md:text-6xl">
            BHOS Event Manager
          </h1>
          <p className="mx-auto max-w-2xl font-sans text-lg text-[var(--muted)]">
            Create events, register participants, QR check-in, and track attendance analytics.
          </p>
          {!user && (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Sign in or create an account to get started.
            </p>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/events"
            className="group rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-6 transition-all hover:border-[var(--accent)]/50 hover:ring-2 hover:ring-[var(--accent)]/20"
          >
            <div className="mb-3 font-mono text-2xl text-[var(--accent)]">/events</div>
            <h2 className="mb-2 font-semibold text-[var(--foreground)]">Manage Events</h2>
            <p className="text-sm text-[var(--muted)]">
              Create, edit, and organize club events with full details.
            </p>
          </Link>

          <Link
            href="/events"
            className="group rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-6 transition-all hover:border-[var(--accent)]/50 hover:ring-2 hover:ring-[var(--accent)]/20"
          >
            <div className="mb-3 font-mono text-2xl text-[var(--accent)]">/register</div>
            <h2 className="mb-2 font-semibold text-[var(--foreground)]">Participant Registration</h2>
            <p className="text-sm text-[var(--muted)]">
              Register attendees and generate unique QR codes for check-in.
            </p>
          </Link>

          <Link
            href="/events"
            className="group rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-6 transition-all hover:border-[var(--accent)]/50 hover:ring-2 hover:ring-[var(--accent)]/20"
          >
            <div className="mb-3 font-mono text-2xl text-[var(--accent)]">/analytics</div>
            <h2 className="mb-2 font-semibold text-[var(--foreground)]">Attendance Analytics</h2>
            <p className="text-sm text-[var(--muted)]">
              Real-time attendance rates and check-in insights.
            </p>
          </Link>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          {user ? (
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-dim)]"
            >
              View All Events
              <span className="font-mono">→</span>
            </Link>
          ) : (
            <div className="flex gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--background)] transition-colors hover:bg-[var(--accent-dim)]"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
