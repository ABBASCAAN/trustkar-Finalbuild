"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { KeyRound, Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <KeyRound className="mx-auto h-12 w-12 text-cyan-600" />
      <h1 className="mt-4 text-center text-2xl font-black">Reset password</h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        We will email you a link to set a new password.
      </p>

      {sent ? (
        <div className="tk-card mt-8 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-green-600" />
          <p className="mt-4 font-semibold text-slate-800">Check your inbox</p>
          <p className="mt-2 text-sm text-slate-600">
            If {email} is registered, you will receive a reset link shortly.
          </p>
          <Link href="/auth/login" className="tk-btn-primary mt-6 inline-flex">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="tk-card mt-8 space-y-4">
          <input
            type="email"
            required
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="tk-input"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="tk-btn-primary w-full">
            {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        No email access?{" "}
        <Link href="/support" className="font-bold text-cyan-700 hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}
