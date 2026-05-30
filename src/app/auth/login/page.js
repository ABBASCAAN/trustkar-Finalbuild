"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/components/auth/AuthShell";
import { normalizePakPhone } from "@/lib/utils";
import { generatePhoneOtp, verifyPhoneOtp } from "@/lib/firestore-helpers";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  User,
  KeyRound,
  Smartphone,
  LogIn,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  MessageCircle,
} from "lucide-react";

function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { login, user, register } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

  // Focus tracking for desktop animation
  const [activeSide, setActiveSide] = useState(null); // "login" | "register" | null

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPass, setLoginShowPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPass, setRegShowPass] = useState(false);
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regStep, setRegStep] = useState("form"); // "form" | "otp" | "done"
  const [regOtp, setRegOtp] = useState("");
  const [regBusy, setRegBusy] = useState(false);
  const [createdUserId, setCreatedUserId] = useState("");

  // Mobile tab
  const [mobileTab, setMobileTab] = useState("login"); // "login" | "register"

  const showLoginError = useCallback((msg) => {
    setLoginError(msg);
    setTimeout(() => setLoginError(""), 6000);
  }, []);

  const showRegError = useCallback((msg) => {
    setRegError(msg);
    setTimeout(() => setRegError(""), 6000);
  }, []);

  function validatePhoneInput(value) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setRegPhone(digits);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      if (typeof window !== "undefined") sessionStorage.removeItem("tk_logged_out");
      await login(loginEmail, loginPassword);
      router.replace(redirect);
    } catch (err) {
      showLoginError(err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) {
      showRegError("Full name is required.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      showRegError("Enter a valid email address.");
      return;
    }
    if (!regPhone || regPhone.length !== 10) {
      showRegError("WhatsApp number must be exactly 10 digits.");
      return;
    }
    if (!regPhone.startsWith("3")) {
      showRegError("WhatsApp number must start with 3 (e.g. 3001234567). Do not include 0.");
      return;
    }
    if (regPassword.length < 6) {
      showRegError("Password must be at least 6 characters.");
      return;
    }

    const normalizedPhone = normalizePakPhone(regPhone);
    setRegLoading(true);
    try {
      const newUser = await register(regEmail, regPassword, regName, normalizedPhone);
      if (!newUser?.uid) throw new Error("Account creation failed.");
      setCreatedUserId(newUser.uid);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("tk_logged_out");
        sessionStorage.setItem("tk_pending_verify_uid", newUser.uid);
        sessionStorage.setItem("tk_pending_verify_phone", regPhone);
      }
      await generatePhoneOtp(newUser.uid, normalizedPhone);
      setRegStep("otp");
    } catch (err) {
      showRegError(err.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (regOtp.length !== 4) {
      showRegError("Enter 4-digit OTP.");
      return;
    }
    if (!createdUserId) {
      showRegError("Session expired. Please try again.");
      return;
    }
    setRegBusy(true);
    try {
      await verifyPhoneOtp(createdUserId, regOtp);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("tk_pending_verify_uid");
        sessionStorage.removeItem("tk_pending_verify_phone");
      }
      setRegStep("done");
    } catch (err) {
      showRegError(err.message || "Verification failed");
    } finally {
      setRegBusy(false);
    }
  }

  // Side animation classes
  const sideBase =
    "transition-all duration-700 ease-out will-change-transform";
  const loginActive =
    activeSide === "login"
      ? "opacity-100 scale-100 blur-0 flex-1"
      : activeSide === "register"
      ? "opacity-[0.15] scale-[0.92] blur-[2px] flex-[0.4] pointer-events-none"
      : "opacity-100 scale-100 blur-0 flex-1";
  const regActive =
    activeSide === "register"
      ? "opacity-100 scale-100 blur-0 flex-1"
      : activeSide === "login"
      ? "opacity-[0.15] scale-[0.92] blur-[2px] flex-[0.4] pointer-events-none"
      : "opacity-100 scale-100 blur-0 flex-1";

  return (
    <AuthShell
      title="Welcome to TrustKar"
      subtitle="Pakistan's safest escrow marketplace"
    >
      {/* Mobile tab toggle */}
      <div className="mb-5 flex rounded-full border border-slate-200 bg-slate-50 p-1 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("login")}
          className={`flex-1 rounded-full py-2 text-xs font-bold transition ${
            mobileTab === "login"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-500"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("register")}
          className={`flex-1 rounded-full py-2 text-xs font-bold transition ${
            mobileTab === "register"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-500"
          }`}
        >
          Create account
        </button>
      </div>

      {/* Desktop split + mobile conditional */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* LOGIN SIDE */}
        <div
          className={`${sideBase} ${loginActive} ${
            mobileTab !== "login" ? "hidden sm:flex" : ""
          }`}
          onFocusCapture={() => setActiveSide("login")}
        >
          <div className="tk-card !p-5 sm:!p-7">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100">
                <LogIn size={18} className="text-sky-700" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Sign in</p>
                <p className="text-[10px] text-slate-500">Access your account</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                  <Mail size={10} /> Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="ali@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="tk-input !py-2.5 text-sm"
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                  <KeyRound size={10} /> Password
                </label>
                <div className="relative">
                  <input
                    type={loginShowPass ? "text" : "password"}
                    required
                    placeholder="••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="tk-input w-full !py-2.5 pr-10 text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setLoginShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {loginShowPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-bold text-sky-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {loginError && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3 text-sm font-bold"
              >
                {loginLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <ArrowRight size={16} /> Sign in
                  </>
                )}
              </button>
            </form>

            {/* Mobile-only link to register */}
            <p className="mt-4 text-center text-xs text-slate-500 sm:hidden">
              No account?{" "}
              <button
                type="button"
                onClick={() => setMobileTab("register")}
                className="font-bold text-sky-700 hover:underline"
              >
                Create one
              </button>
            </p>
          </div>
        </div>

        {/* OR divider on desktop */}
        <div
          className={`hidden flex-col items-center justify-center sm:flex ${
            activeSide ? "opacity-0" : "opacity-100"
          } transition-opacity duration-500`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-black text-slate-400 shadow-sm">
            OR
          </div>
        </div>

        {/* REGISTER SIDE */}
        <div
          className={`${sideBase} ${regActive} ${
            mobileTab !== "register" ? "hidden sm:flex" : ""
          }`}
          onFocusCapture={() => setActiveSide("register")}
        >
          <div className="tk-card !p-5 sm:!p-7">
            {regStep === "form" && (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                    <Sparkles size={18} className="text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Create account
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Join & verify in 2 minutes
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                      <User size={10} /> Full Name
                    </label>
                    <input
                      required
                      placeholder="Ali Khan"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="tk-input !py-2.5 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                      <Mail size={10} /> Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ali@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="tk-input !py-2.5 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                      <Smartphone size={10} /> WhatsApp Number
                    </label>
                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-emerald-200 transition">
                      <span className="flex h-10 items-center border-r border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500 select-none">
                        +92
                      </span>
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => validatePhoneInput(e.target.value)}
                        placeholder="3001234567"
                        className="h-10 flex-1 bg-transparent px-3 text-sm outline-none"
                      />
                    </div>
                    <p className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                      <MessageCircle size={9} />
                      Your active WhatsApp number for OTP
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                      <KeyRound size={10} /> Password
                    </label>
                    <div className="relative">
                      <input
                        type={regShowPass ? "text" : "password"}
                        required
                        placeholder="Min 6 characters"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="tk-input w-full !py-2.5 pr-10 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setRegShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {regShowPass ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>
                  </div>

                  {regError && (
                    <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                      {regError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3 text-sm font-bold"
                  >
                    {regLoading ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Sparkles size={16} /> Create Account
                      </>
                    )}
                  </button>
                </form>

                {/* Mobile-only link to login */}
                <p className="mt-4 text-center text-xs text-slate-500 sm:hidden">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMobileTab("login")}
                    className="font-bold text-sky-700 hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}

            {regStep === "otp" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                    <Lock size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Verify WhatsApp
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Admin will send OTP shortly
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-sky-50 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase text-sky-600">
                    Enter OTP Code
                  </p>
                  <input
                    value={regOtp}
                    onChange={(e) =>
                      setRegOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="• • • •"
                    className="mt-2 w-full bg-transparent text-center text-3xl font-black tracking-[0.4em] text-sky-900 outline-none placeholder:text-sky-300"
                    type="tel"
                    inputMode="numeric"
                  />
                  <p className="mt-2 text-[10px] text-sky-500">
                    Valid for 10 minutes only
                  </p>
                </div>

                {regError && (
                  <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                    {regError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={regBusy || regOtp.length !== 4}
                  onClick={handleVerifyOtp}
                  className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3 text-sm font-bold"
                >
                  {regBusy ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <ShieldCheck size={16} /> Verify & Complete KYC
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRegStep("form");
                    setRegOtp("");
                    setRegError("");
                  }}
                  className="flex w-full items-center justify-center gap-1 text-center text-xs font-bold text-slate-500 hover:text-sky-600"
                >
                  <ArrowLeft size={12} /> Back to details
                </button>
              </div>
            )}

            {regStep === "done" && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <ShieldCheck size={28} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-base font-black text-emerald-900">
                    KYC Verified
                  </p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Your account is fully activated. Start buying and selling safely.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.replace("/dashboard")}
                  className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3 text-sm font-bold"
                >
                  <ArrowRight size={16} /> Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-500">
        <Link href="/support" className="text-sky-700 hover:underline">
          Need help? Contact support
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin text-sky-600" />
      }
    >
      <AuthPage />
    </Suspense>
  );
}
