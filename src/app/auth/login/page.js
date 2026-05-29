"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/components/auth/AuthShell";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (user) {
      router.replace(redirect);
    }
  }, [user, redirect, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem("tk_logged_out");
      await login(email, password);
      router.replace(redirect);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue buying and selling safely">
      <form onSubmit={handleSubmit} className="tk-card space-y-4 !p-6">
        <input
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="tk-input"
          autoComplete="email"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="tk-input"
          autoComplete="current-password"
        />
        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-sm font-bold text-sky-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="tk-btn-primary w-full !py-3.5">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        New here?{" "}
        <Link
          href={`/auth/register?redirect=${encodeURIComponent(redirect)}`}
            className="font-bold text-sky-700 hover:underline"
        >
          Create account
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-slate-500">
        <Link href="/support" className="text-sky-700 hover:underline">
          Need help? Contact support
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin text-sky-600" />}>
      <LoginForm />
    </Suspense>
  );
}
