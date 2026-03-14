"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

function LoginForm() {
  const { user, signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") ?? "/events";
  // Only allow same-origin paths (prevents redirect to external URLs)
  const redirect = rawRedirect.startsWith("/") ? rawRedirect : "/events";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

  function handleGoogleSuccess() {
    router.replace(redirect);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] p-8">
        <h1 className="mb-2 font-mono text-2xl font-bold text-[var(--foreground)]">
          Sign in
        </h1>
        <p className="mb-6 text-[var(--muted)]">
          Sign in to manage events and participants.
        </p>

        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={setError}
          onLoading={setLoading}
          disabled={loading}
        />

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-sm text-[var(--muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-[var(--background)] hover:bg-[var(--accent-dim)] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in with email"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[var(--accent)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
