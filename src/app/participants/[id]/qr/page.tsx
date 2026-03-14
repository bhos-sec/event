"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";

export default function ParticipantQRPage() {
  const params = useParams();
  const id = params.id as string;
  const [participant, setParticipant] = useState<{
    name: string;
    email: string;
    qrToken: string;
    event: { name: string; id: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/participants/${id}`)
      .then((r) => r.json())
      .then(setParticipant)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !participant) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </div>
    );
  }

  const qrUrl = `/api/participants/${id}/qr?format=png`;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] p-8 text-center">
          <h1 className="font-mono text-xl font-bold text-[var(--foreground)]">
            {participant.event.name}
          </h1>
          <p className="mt-1 text-[var(--muted)]">{participant.name}</p>
          <p className="text-sm text-[var(--muted)]">{participant.email}</p>

          <div className="mx-auto mt-6 flex w-64 justify-center rounded-xl bg-[var(--surface)] p-4">
            <Image
              src={qrUrl}
              alt="QR Code for check-in"
              className="h-64 w-64"
              width={256}
              height={256}
              unoptimized
            />
          </div>

          <p className="mt-4 text-sm text-[var(--muted)]">
            Show this QR code at the event entrance for check-in.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              href={`/r/${participant.qrToken}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Manage my registration
            </Link>
            <Link
              href={`/events/${participant.event.id}`}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← Back to event
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
