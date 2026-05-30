"use client";

import { useState, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/components/auth/AuthShell";
import { normalizePakPhone } from "@/lib/utils";
import { generatePhoneOtp, verifyPhoneOtp } from "@/lib/firestore-helpers";
import {
  Loader2,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  Lock,
} from "lucide-react";

function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("account"); // "account" | "otp" | "done"
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [createdUserId, setCreatedUserId] = useState("");
  const { register } = useAuth();
  const router = useRouter();

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  }, []);

  function validatePhoneInput(value) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  }

  async function handleCreateAccount(e) {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      showError("Full name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      showError("Enter a valid email address.");
      return;
    }
    if (!phone || phone.length !== 10) {
      showError("Mobile number must be 10 digits (e.g. 3000000000).");
      return;
    }
    if (!phone.startsWith("3")) {
      showError("Mobile number must start with 3 (e.g. 3000000000). Do not include 0.");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    const normalizedPhone = normalizePakPhone(phone);
    setLoading(true);
    try {
      const newUser = await register(email, password, displayName, normalizedPhone);
      if (!newUser?.uid) throw new Error("Account creation failed.");
      setCreatedUserId(newUser.uid);
      if (typeof window !== "undefined") sessionStorage.removeItem("tk_logged_out");
      await generatePhoneOtp(newUser.uid, normalizedPhone);
      setStep("otp");
    } catch (err) {
      showError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 4) {
      showError("Enter 4-digit OTP.");
      return;
    }
    if (!createdUserId) {
      showError("Session expired. Please refresh and try again.");
      return;
    }
    setBusy(true);
    try {
      await verifyPhoneOtp(createdUserId, otp);
      setStep("done");
    } catch (err) {
      showError(err.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join Pakistan's escrow-protected marketplace">
      {step === "account" && (
        <>
          <form onSubmit={handleCreateAccount} className="tk-card space-y-4 !p-6">
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
            <div>
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white">
                <span className="flex h-12 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-500 select-none">
                  +92
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => validatePhoneInput(e.target.value)}
                  placeholder="3000000000"
                  className="h-12 flex-1 bg-transparent px-3 text-sm outline-none"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Enter 10-digit number starting with 3. +92 is pre-filled.
              </p>
            </div>
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
        </>
      )}

      {step === "otp" && (
        <div className="tk-card space-y-4 !p-6">
          <div className="mb-2 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-[10px] font-bold uppercase text-sky-700">
              <Smartphone size={12} /> Enter number
            </div>
            <div className="h-px w-6 bg-slate-200" />
            <div className="flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-[10px] font-bold uppercase text-sky-700">
              <Lock size={12} /> Enter OTP
            </div>
            <div className="h-px w-6 bg-slate-200" />
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400">
              <CheckCircle size={12} /> Verified
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Lock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Enter OTP</p>
              <p className="text-xs text-slate-500">
                WhatsApp pe OTP check karein. Valid for 10 minutes.
              </p>
              <p className="text-xs font-bold text-sky-700">
                +92 {phone}
              </p>
            </div>
          </div>

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
            className="tk-input w-full text-center text-2xl tracking-[0.5em]"
            type="tel"
          />

          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="button"
            disabled={busy || otp.length !== 4}
            onClick={handleVerifyOtp}
            className="tk-btn-primary w-full"
          >
            {busy ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Verify OTP"}
          </button>

          <button
            type="button"
            onClick={() => { setStep("account"); setOtp(""); }}
            className="w-full text-center text-xs font-bold text-slate-500 hover:text-sky-600"
          >
            Back to signup
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="tk-card space-y-4 !p-6 text-center">
          <ShieldCheck size={40} className="mx-auto text-emerald-600" />
          <p className="text-base font-bold text-emerald-900">Phone verified</p>
          <p className="text-sm text-emerald-700">Your account and KYC are complete. You can now use escrow and post deals.</p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="tk-btn-primary w-full"
          >
            Continue to Dashboard
          </button>
        </div>
      )}
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
