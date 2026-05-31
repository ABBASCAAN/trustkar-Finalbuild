"use client";

import { useState, Suspense, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AuthShell from "@/components/auth/AuthShell";
import { normalizePakPhone } from "@/lib/utils";
import {
  isEmailRegistered,
  isPhoneRegistered,
  generateSignupOtp,
  verifySignupOtp,
} from "@/lib/firestore-helpers";
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
  Send,
} from "lucide-react";

function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { login, user, register, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) return;
    // Wait until auth+profile fully loads before deciding redirect
    if (authLoading) return;
    // Profile hasn't loaded yet — wait (prevents homepage race condition)
    if (!profile) return;
    // Redirect to onboarding if account type not selected yet
    if (!profile.accountType) {
      router.replace("/account-type");
      return;
    }
    router.replace(redirect);
  }, [user, profile, authLoading, redirect, router]);

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

  // Mobile tab
  const [mobileTab, setMobileTab] = useState("login");

  // Recover signup form + OTP step on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedStep = sessionStorage.getItem("tk_signup_step");
    if (savedStep === "otp") {
      const sName = sessionStorage.getItem("tk_signup_name");
      const sEmail = sessionStorage.getItem("tk_signup_email");
      const sPhone = sessionStorage.getItem("tk_signup_phone");
      const sPass = sessionStorage.getItem("tk_signup_password");
      if (sName && sEmail && sPhone) {
        setRegName(sName);
        setRegEmail(sEmail);
        setRegPhone(sPhone);
        if (sPass) setRegPassword(sPass);
        setRegStep("otp");
        setMobileTab("register");
      }
    }
  }, []);

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

  function clearSignupSession() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("tk_signup_step");
    sessionStorage.removeItem("tk_signup_name");
    sessionStorage.removeItem("tk_signup_email");
    sessionStorage.removeItem("tk_signup_phone");
    sessionStorage.removeItem("tk_signup_password");
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

  async function handleSendOtp(e) {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) { showRegError("Full name is required."); return; }
    if (!regEmail.trim() || !regEmail.includes("@")) { showRegError("Enter a valid email address."); return; }
    if (!regPhone || regPhone.length !== 10) { showRegError("WhatsApp number must be exactly 10 digits."); return; }
    if (!regPhone.startsWith("3")) { showRegError("WhatsApp number must start with 3 (e.g. 3001234567). Do not include 0."); return; }
    if (regPassword.length < 6) { showRegError("Password must be at least 6 characters."); return; }

    const normalizedPhone = normalizePakPhone(regPhone);
    setRegLoading(true);
    try {
      const emailTaken = await isEmailRegistered(regEmail);
      if (emailTaken) { showRegError("This email is already registered. Please sign in."); return; }
      const phoneTaken = await isPhoneRegistered(normalizedPhone);
      if (phoneTaken) { showRegError("This mobile number is already registered. Please sign in."); return; }

      await generateSignupOtp(normalizedPhone);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("tk_signup_step", "otp");
        sessionStorage.setItem("tk_signup_name", regName);
        sessionStorage.setItem("tk_signup_email", regEmail);
        sessionStorage.setItem("tk_signup_phone", regPhone);
        sessionStorage.setItem("tk_signup_password", regPassword);
      }
      setRegStep("otp");
    } catch (err) {
      showRegError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setRegLoading(false);
    }
  }

  async function handleVerifyAndCreate() {
    if (regOtp.length !== 4) { showRegError("Enter 4-digit OTP."); return; }
    if (!regName || !regEmail || !regPhone || !regPassword) {
      showRegError("Session expired. Please fill details again.");
      setRegStep("form");
      clearSignupSession();
      return;
    }
    setRegBusy(true);
    try {
      const normalizedPhone = normalizePakPhone(regPhone);
      const verified = await verifySignupOtp(normalizedPhone, regOtp);
      if (!verified) { showRegError("Invalid or expired OTP. Please try again."); return; }

      // Double-check uniqueness right before creation (race condition protection)
      const emailTaken = await isEmailRegistered(regEmail);
      if (emailTaken) { showRegError("This email was just registered by someone else. Please sign in."); return; }
      const phoneTaken = await isPhoneRegistered(normalizedPhone);
      if (phoneTaken) { showRegError("This phone was just registered by someone else. Please sign in."); return; }

      const newUser = await register(regEmail, regPassword, regName, normalizedPhone, { phoneVerified: true });
      if (!newUser?.uid) throw new Error("Account creation failed after verification.");

      clearSignupSession();
      if (typeof window !== "undefined") sessionStorage.removeItem("tk_logged_out");
      setRegStep("done");
    } catch (err) {
      showRegError(err.message || "Verification or account creation failed.");
    } finally {
      setRegBusy(false);
    }
  }

  const cardWrap = "group/card w-full";
  const cardInner =
    "h-full rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-lg shadow-slate-200/40 backdrop-blur-sm transition-all duration-700 ease-out sm:p-8";

  return (
    <AuthShell title="Welcome to TrustKar" subtitle="Pakistan's safest escrow marketplace">
      {/* Tab toggle — always visible */}
      <div className="mb-5 flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur-sm">
        <button type="button" onClick={() => setMobileTab("login")}
          className={`flex-1 rounded-full py-2.5 text-xs font-bold transition ${mobileTab === "login" ? "bg-slate-900 text-white shadow" : "text-slate-500"}`}>Sign in</button>
        <button type="button" onClick={() => setMobileTab("register")}
          className={`flex-1 rounded-full py-2.5 text-xs font-bold transition ${mobileTab === "register" ? "bg-slate-900 text-white shadow" : "text-slate-500"}`}>Create account</button>
      </div>

      {/* Single card layout — same on all screen sizes */}
      <div className="group/wrap flex flex-col gap-4">
        {/* REGISTER SIDE */}
        <div className={`${cardWrap} ${mobileTab !== "register" ? "hidden" : ""}`}>
          <div className={cardInner}>
            {regStep === "form" && (
              <>
                <div className="mb-7 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
                    <Sparkles size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">Create account</p>
                    <p className="text-xs font-medium text-slate-400">Join & verify in 2 minutes</p>
                  </div>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <User size={13} /> Full Name
                    </label>
                    <input required placeholder="Ali Khan" value={regName} onChange={(e) => setRegName(e.target.value)}
                      className="tk-input !rounded-xl !py-3.5 text-sm transition focus:ring-2 focus:ring-emerald-200" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <Mail size={13} /> Email
                    </label>
                    <input type="email" required placeholder="ali@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                      className="tk-input !rounded-xl !py-3.5 text-sm transition focus:ring-2 focus:ring-emerald-200" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <Smartphone size={13} /> WhatsApp Number
                    </label>
                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
                      <span className="flex h-12 items-center border-r border-slate-200 bg-slate-50 px-3.5 text-sm font-bold text-slate-500 select-none">+92</span>
                      <input type="tel" value={regPhone} onChange={(e) => validatePhoneInput(e.target.value)} placeholder="3001234567"
                        className="h-12 flex-1 bg-transparent px-3.5 text-sm outline-none" />
                    </div>
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600/80">
                      <MessageCircle size={11} /> Your active WhatsApp number for OTP
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      <KeyRound size={13} /> Password
                    </label>
                    <div className="relative">
                      <input type={regShowPass ? "text" : "password"} required placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                        className="tk-input w-full !rounded-xl !py-3.5 pr-10 text-sm transition focus:ring-2 focus:ring-emerald-200" />
                      <button type="button" onClick={() => setRegShowPass((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                        {regShowPass ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {regError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{regError}</div>}

                  <button type="submit" disabled={regLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:translate-y-0 disabled:opacity-60">
                    {regLoading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send OTP</>}
                  </button>
                </form>

                  </>
            )}

            {regStep === "otp" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
                    <Lock size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">Verify WhatsApp</p>
                    <p className="text-xs font-medium text-slate-400">OTP sent to +92 {regPhone}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-sky-50/80 p-6 text-center ring-1 ring-sky-100">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600">Enter OTP Code</p>
                  <input value={regOtp} onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="• • • •" className="mt-4 w-full bg-transparent text-center text-4xl font-black tracking-[0.5em] text-sky-900 outline-none placeholder:text-sky-300"
                    type="tel" inputMode="numeric" />
                  <p className="mt-3 text-[11px] font-medium text-sky-500">Valid for 10 minutes</p>
                </div>

                {regError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{regError}</div>}

                <button type="button" disabled={regBusy || regOtp.length !== 4} onClick={handleVerifyAndCreate}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-300/40 transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl active:translate-y-0 disabled:opacity-60">
                  {regBusy ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Verify & Create Account</>}
                </button>

                <button type="button" onClick={() => { setRegStep("form"); setRegOtp(""); setRegError(""); clearSignupSession(); }}
                  className="flex w-full items-center justify-center gap-1 text-center text-sm font-bold text-slate-400 transition hover:text-sky-600">
                  <ArrowLeft size={14} /> Back to details
                </button>
              </div>
            )}

            {regStep === "done" && (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200">
                  <ShieldCheck size={36} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-emerald-900">Account Created</p>
                  <p className="mt-2 text-sm font-medium text-emerald-700/80">Your account is fully activated with verified KYC. Start buying and selling safely.</p>
                </div>
                <button type="button" onClick={() => router.replace("/dashboard")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg active:translate-y-0">
                  <ArrowRight size={18} /> Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LOGIN SIDE */}
        <div className={`${cardWrap} ${mobileTab !== "login" ? "hidden" : ""}`}>
          <div className={cardInner}>
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-200">
                <LogIn size={24} className="text-sky-600" />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">Sign in</p>
                <p className="text-xs font-medium text-slate-400">Access your account</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <Mail size={13} /> Email
                </label>
                <input type="email" required placeholder="ali@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  className="tk-input !rounded-xl !py-3.5 text-sm transition focus:ring-2 focus:ring-sky-200" autoComplete="email" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <KeyRound size={13} /> Password
                </label>
                <div className="relative">
                  <input type={loginShowPass ? "text" : "password"} required placeholder="••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    className="tk-input w-full !rounded-xl !py-3.5 pr-10 text-sm transition focus:ring-2 focus:ring-sky-200" autoComplete="current-password" />
                  <button type="button" onClick={() => setLoginShowPass((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                    {loginShowPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-xs font-bold text-sky-700 transition hover:text-sky-800 hover:underline">Forgot password?</Link>
              </div>

              {loginError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{loginError}</div>}

              <button type="submit" disabled={loginLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-200/60 transition hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-lg active:translate-y-0 disabled:opacity-60">
                {loginLoading ? <Loader2 className="animate-spin" size={18} /> : <><ArrowRight size={18} /> Sign in</>}
              </button>
            </form>

          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs font-medium text-slate-400">
        <Link href="/support" className="text-sky-600 transition hover:text-sky-700 hover:underline">Need help? Contact support</Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin text-sky-600" />}>
      <AuthPage />
    </Suspense>
  );
}
