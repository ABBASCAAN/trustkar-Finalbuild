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
  const { login, user, register } = useAuth();

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

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

  const cardWrap = "w-full sm:w-1/2";

  return (
    <AuthShell title="Welcome to TrustKar" subtitle="Pakistan's safest escrow marketplace">
      {/* Mobile tab toggle */}
      <div className="mb-5 flex rounded-full border border-slate-200 bg-slate-50 p-1 sm:hidden">
        <button type="button" onClick={() => setMobileTab("login")}
          className={`flex-1 rounded-full py-2 text-xs font-bold transition ${mobileTab === "login" ? "bg-slate-900 text-white shadow" : "text-slate-500"}`}>Sign in</button>
        <button type="button" onClick={() => setMobileTab("register")}
          className={`flex-1 rounded-full py-2 text-xs font-bold transition ${mobileTab === "register" ? "bg-slate-900 text-white shadow" : "text-slate-500"}`}>Create account</button>
      </div>

      {/* Desktop split + mobile conditional */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* LOGIN SIDE */}
        <div className={`${cardWrap} ${mobileTab !== "login" ? "hidden sm:block" : ""}`}>
          <div className="tk-card h-full !p-6 sm:!p-9">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100">
                <LogIn size={22} className="text-sky-700" />
              </div>
              <div>
                <p className="text-base font-black text-slate-900">Sign in</p>
                <p className="text-xs text-slate-500">Access your account</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
                  <Mail size={12} /> Email
                </label>
                <input type="email" required placeholder="ali@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  className="tk-input !py-3 text-sm" autoComplete="email" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
                  <KeyRound size={12} /> Password
                </label>
                <div className="relative">
                  <input type={loginShowPass ? "text" : "password"} required placeholder="••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    className="tk-input w-full !py-3 pr-10 text-sm" autoComplete="current-password" />
                  <button type="button" onClick={() => setLoginShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {loginShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-xs font-bold text-sky-700 hover:underline">Forgot password?</Link>
              </div>

              {loginError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{loginError}</div>}

              <button type="submit" disabled={loginLoading} className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm font-bold">
                {loginLoading ? <Loader2 className="animate-spin" size={18} /> : <><ArrowRight size={18} /> Sign in</>}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500 sm:hidden">
              No account? <button type="button" onClick={() => setMobileTab("register")} className="font-bold text-sky-700 hover:underline">Create one</button>
            </p>
          </div>
        </div>

        {/* OR divider */}
        <div className="hidden flex-col items-center justify-center sm:flex">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-black text-slate-400 shadow-sm">OR</div>
        </div>

        {/* REGISTER SIDE */}
        <div className={`${cardWrap} ${mobileTab !== "register" ? "hidden sm:block" : ""}`}>
          <div className="tk-card h-full !p-6 sm:!p-9">
            {regStep === "form" && (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
                    <Sparkles size={22} className="text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900">Create account</p>
                    <p className="text-xs text-slate-500">Join & verify in 2 minutes</p>
                  </div>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
                      <User size={12} /> Full Name
                    </label>
                    <input required placeholder="Ali Khan" value={regName} onChange={(e) => setRegName(e.target.value)} className="tk-input !py-3 text-sm" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
                      <Mail size={12} /> Email
                    </label>
                    <input type="email" required placeholder="ali@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="tk-input !py-3 text-sm" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
                      <Smartphone size={12} /> WhatsApp Number
                    </label>
                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:ring-2 focus-within:ring-emerald-200 transition">
                      <span className="flex h-11 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-500 select-none">+92</span>
                      <input type="tel" value={regPhone} onChange={(e) => validatePhoneInput(e.target.value)} placeholder="3001234567" className="h-11 flex-1 bg-transparent px-3 text-sm outline-none" />
                    </div>
                    <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                      <MessageCircle size={11} /> Your active WhatsApp number for OTP
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
                      <KeyRound size={12} /> Password
                    </label>
                    <div className="relative">
                      <input type={regShowPass ? "text" : "password"} required placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="tk-input w-full !py-3 pr-10 text-sm" />
                      <button type="button" onClick={() => setRegShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {regShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {regError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{regError}</div>}

                  <button type="submit" disabled={regLoading} className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm font-bold">
                    {regLoading ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send OTP</>}
                  </button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-500 sm:hidden">
                  Already have an account? <button type="button" onClick={() => setMobileTab("login")} className="font-bold text-sky-700 hover:underline">Sign in</button>
                </p>
              </>
            )}

            {regStep === "otp" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
                    <Lock size={22} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900">Verify WhatsApp</p>
                    <p className="text-xs text-slate-500">Admin will send OTP to +92 {regPhone}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-sky-50 p-5 text-center">
                  <p className="text-[11px] font-bold uppercase text-sky-600">Enter OTP Code</p>
                  <input value={regOtp} onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="• • • •" className="mt-3 w-full bg-transparent text-center text-4xl font-black tracking-[0.4em] text-sky-900 outline-none placeholder:text-sky-300"
                    type="tel" inputMode="numeric" />
                  <p className="mt-3 text-[11px] text-sky-500">Valid for 10 minutes only</p>
                </div>

                {regError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{regError}</div>}

                <button type="button" disabled={regBusy || regOtp.length !== 4} onClick={handleVerifyAndCreate}
                  className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm font-bold">
                  {regBusy ? <Loader2 className="animate-spin" size={18} /> : <><ShieldCheck size={18} /> Verify & Create Account</>}
                </button>

                <button type="button" onClick={() => { setRegStep("form"); setRegOtp(""); setRegError(""); clearSignupSession(); }}
                  className="flex w-full items-center justify-center gap-1 text-center text-sm font-bold text-slate-500 hover:text-sky-600">
                  <ArrowLeft size={14} /> Back to details
                </button>
              </div>
            )}

            {regStep === "done" && (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <ShieldCheck size={32} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-900">Account Created</p>
                  <p className="mt-1 text-sm text-emerald-700">Your account is fully activated with verified KYC. Start buying and selling safely.</p>
                </div>
                <button type="button" onClick={() => router.replace("/dashboard")}
                  className="tk-btn-primary flex w-full items-center justify-center gap-2 !py-3.5 text-sm font-bold">
                  <ArrowRight size={18} /> Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-500">
        <Link href="/support" className="text-sky-700 hover:underline">Need help? Contact support</Link>
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
