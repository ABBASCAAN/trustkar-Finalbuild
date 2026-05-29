"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/components/auth/AuthShell";
import { Loader2 } from "lucide-react";

function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName, phone);
      if (typeof window !== "undefined") sessionStorage.removeItem("tk_logged_out");
      router.replace(redirect);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join Pakistan's escrow-protected marketplace">
      <form onSubmit={handleSubmit} className="tk-card space-y-4 !p-6">
        <input
          required
          placeholder="Full name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="tk-input"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="tk-input"
        />
        <input
          placeholder="Phone (+92...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="tk-input"
        />
        <input
          type="password"
          required
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="tk-input"
        />
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="tk-btn-primary w-full !py-3.5">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
        <p className="mt-5 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-bold text-sky-700 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin text-sky-600" />}>
      <RegisterForm />
    </Suspense>
  );
}
