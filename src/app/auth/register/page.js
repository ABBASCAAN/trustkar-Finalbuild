"use client";

import { useState, Suspense, useCallback, useEffect } from "react";
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
  Eye,
  EyeOff,
  Mail,
  User,
  KeyRound,
  ArrowLeft,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const STEPS = [
  { id: "account", label: "Details", icon: User },
  { id: "otp", label: "Verify", icon: Lock },
  { id: "done", label: "Done", icon: CheckCircle },
];

function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    setTimeout(() => setError(""), 6000);
  }, []);

  // Recover OTP step if user refreshes or leaves and comes back
  useEffect(() => {
    if (typeof window === "undefined") return;
    const pendingUid = sessionStorage.getItem("tk_pending_verify_uid");
    const pendingPhone = sessionStorage.getItem("tk_pending_verify_phone");
    if (pendingUid && pendingPhone) {
      setCreatedUserId(pendingUid);
      setPhone(pendingPhone);
      setStep("otp");
    }
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
      showError("WhatsApp number must be exactly 10 digits.");
      return;
    }
    if (!phone.startsWith("3")) {
      showError("WhatsApp number must start with 3 (e.g. 3001234567). Do not include 0.");
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
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("tk_logged_out");
        sessionStorage.setItem("tk_pending_verify_uid", newUser.uid);
        sessionStorage.setItem("tk_pending_verify_phone", phone);
      }
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
      showError("Session expired. Please go back and sign up again.");
      return;
    }
    setBusy(true);
    try {
      await verifyPhoneOtp(createdUserId, otp);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("tk_pending_verify_uid");
        sessionStorage.removeItem("tk_pending_verify_phone");
      }
      setStep("done");
    } catch (err) {
      showError(err.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  function handleBackToSignup() {
    setStep("account");
    setOtp("");
    setError("");
  }

  return (
    <AuthShell title="Create your account" subtitle="Join Pakistan's safest escrow marketplace">
      {/* Step Progress */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const isActive =
            (step === "account" && i === 0) ||
            (step === "otp" && i === 1) ||
            (step === "done" && i === 2) ||
            (step === "otp" && i === 0) ||
            (step === "done" && (i === 0 || i === 1));
          const isCurrent =
            (step === "account" && i === 0) ||
            (step === "otp" && i === 1) ||
            (step === "done" && i === 2);
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase transition ${
                  isCurrent
                    ? "bg-sky-600 text-white shadow"
                    : isActive
                    ? "bg-sky-100 text-sky-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <s.icon size={12} /> {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-5 ${isActive ? "bg-sky-300" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {step === "account" && (
        <>
          <form onSubmit={handleCreateAccount} className="tk-card space-y-5 !p-6 sm:!p-8">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <User size={13} className="text-sky-600" /> Full Name
              </label>
              <input
                required
                placeholder="Ali Khan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="tk-input !py-3"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Mail size={13} className="text-sky-600" /> Email Address
              </label>
              <input
                type="email"
                required
                placeholder="ali@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="tk-input !py-3"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Smartphone size={13} className="text-sky-600" /> WhatsApp Number
              </label>
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-sky-200 transition">
                <span className="flex h-12 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-500 select-none">
                  +92
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => validatePhoneInput(e.target.value)}
                  placeholder="3001234567"
                  className="h-12 flex-1 bg-transparent px-3 text-sm outline-none"
                />
              </div>
              <p className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                <MessageCircle size={10} />
                Enter your active WhatsApp number. OTP will be sent here.
              </p>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <KeyRound size={13} className="text-sky-600" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="tk-input w-full !py-3 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm font-bold"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Sparkles size={16} /> Create Account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-bold text-sky-700 hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}

      {step === "otp" && (
        <div className="tk-card space-y-5 !p-6 sm:!p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Lock size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Verify your WhatsApp</p>
              <p className="text-xs text-slate-500">
                Admin will send a 4-digit OTP to your WhatsApp within a few minutes.
              </p>
              <p className="mt-0.5 text-xs font-bold text-sky-700">
                +92 {phone}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-sky-50 p-4 text-center">
            <p className="text-[10px] font-bold uppercase text-sky-600">Enter OTP Code</p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="• • • •"
              className="mt-2 w-full bg-transparent text-center text-3xl font-black tracking-[0.4em] text-sky-900 outline-none placeholder:text-sky-300"
              type="tel"
              inputMode="numeric"
            />
            <p className="mt-2 text-[10px] text-sky-500">
              Valid for 10 minutes only
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={busy || otp.length !== 4}
            onClick={handleVerifyOtp}
            className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm font-bold"
          >
            {busy ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <ShieldCheck size={16} /> Verify & Complete KYC
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBackToSignup}
            className="flex w-full items-center justify-center gap-1 text-center text-xs font-bold text-slate-500 hover:text-sky-600"
          >
            <ArrowLeft size={12} /> Back to signup details
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="tk-card space-y-5 !p-6 text-center sm:!p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-black text-emerald-900">KYC Verified</p>
            <p className="mt-1 text-sm text-emerald-700">
              Your account is fully activated. You can now buy, sell, and use escrow protection.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm font-bold"
          >
            <CheckCircle size={16} /> Continue to Dashboard
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
