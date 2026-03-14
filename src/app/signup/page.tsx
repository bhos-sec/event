"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getPasswordError } from "@/lib/password";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function SignUpPage() {
  const { signUpWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const pwdError = getPasswordError(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password);
      router.replace("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center px-4">
      <div className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-hover)] p-8">
        <h1 className="mb-2 font-mono text-2xl font-bold text-[var(--foreground)]">
          Create account
        </h1>
        <p className="mb-6 text-[var(--muted)]">
          Sign up to create and manage events.
        </p>

        <GoogleSignInButton
          onSuccess={() => router.replace("/events")}
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
            placeholder="Password (min 8 chars, letter + special char)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-medium text-[var(--background)] hover:bg-[var(--accent-dim)] disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-400">{error}</p>
        )}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
