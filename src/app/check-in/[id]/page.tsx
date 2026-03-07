"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import QRScanner from "@/components/QRScanner";

export default function CheckInPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const tokenFromUrl = searchParams.get("token");

  const [event, setEvent] = useState<{ id: string; name: string } | null>(null);
  const [token, setToken] = useState(tokenFromUrl || "");
  const [manualToken, setManualToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    participant?: { name: string };
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => {
      setResult(null);
      setManualToken("");
      inputRef.current?.focus();
    }, 3000);
    return () => clearTimeout(t);
  }, [result]);

  async function doCheckIn(qrToken: string) {
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: `Welcome, ${data.participant?.name || "attendee"}!`,
          participant: data.participant,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "Check-in failed",
        });
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setChecking(false);
    }
  }

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    const qrToken = token || manualToken.trim();
    if (!qrToken) return;
    await doCheckIn(qrToken);
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

  return (
    <div className="min-h-screen bg-slate-950">
      <Nav />
      <main className="mx-auto max-w-lg px-4 py-12">
        <Link
          href={`/events/${eventId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400"
        >
          ← Back to event
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <h1 className="font-mono text-2xl font-bold text-white">
            Check-in: {event.name}
          </h1>
          <p className="mt-2 text-slate-400">
            Scan your QR code or enter your check-in token below.
          </p>

          {tokenFromUrl ? (
            <div className="mt-6">
              <p className="mb-2 text-sm text-slate-500">Token from URL detected</p>
              <form onSubmit={handleCheckIn}>
                <input
                  type="hidden"
                  value={token}
                  onChange={() => {}}
                />
                <button
                  type="submit"
                  disabled={checking}
                  className="w-full rounded-lg bg-cyan-600 py-4 font-mono font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {checking ? "Checking in..." : "Check In"}
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <QRScanner
                onScan={(data) => {
                  let token = "";
                  try {
                    const parsed = typeof data === "string" ? JSON.parse(data) : data;
                    token = parsed.token || parsed.url?.match(/token=([^&]+)/)?.[1] || "";
                  } catch {
                    token = data.includes("token=")
                      ? new URL(data).searchParams.get("token") || data
                      : data;
                  }
                  if (token) {
                    setManualToken(token);
                    doCheckIn(token);
                  }
                }}
              />
              <form onSubmit={handleCheckIn} className="space-y-4">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Or paste QR token manually"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-4 font-mono text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  disabled={checking || !manualToken.trim()}
                  className="w-full rounded-lg bg-cyan-600 py-4 font-mono font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {checking ? "Checking in..." : "Check In"}
                </button>
              </form>
            </div>
          )}

          {result && (
            <div
              className={`mt-6 rounded-lg p-4 ${
                result.success
                  ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
                  : "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
              }`}
            >
              <p className="font-mono font-medium">
                {result.success ? "✓ " : "✗ "}
                {result.message}
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Organizers: Use the{" "}
          <Link href={`/events/${eventId}`} className="text-cyan-400 hover:underline">
            event page
          </Link>{" "}
          to manage participants and view analytics.
        </p>
      </main>
    </div>
  );
}
