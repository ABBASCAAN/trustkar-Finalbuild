"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BRAND_NAME } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { generatePhoneOtp, verifyPhoneOtp } from "@/lib/firestore-helpers";
import {
  Loader2,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  Send,
  Lock,
} from "lucide-react";
import Link from "next/link";

function KycForm() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "otp" | "done"
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (profile?.phoneVerified) setStep("done");
  }, [profile]);

  async function handleSendOtp() {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      showToast("Enter a valid mobile number (10+ digits)", "error");
      return;
    }
    setBusy(true);
    try {
      await generatePhoneOtp(user.uid, cleaned);
      showToast("OTP request sent — check your WhatsApp shortly", "success");
      setStep("otp");
    } catch (err) {
      showToast(err.message || "Failed to send OTP request", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 4) {
      showToast("Enter 4-digit OTP", "error");
      return;
    }
    setBusy(true);
    try {
      await verifyPhoneOtp(user.uid, otp);
      await refreshProfile();
      showToast("Phone verified successfully");
      setStep("done");
    } catch (err) {
      showToast(err.message || "Verification failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="tk-container py-20 text-center">
        <Link href="/auth/login?redirect=/auth/kyc" className="text-sky-600 font-bold">
          Sign in to verify identity
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/90 to-[var(--tk-bg)] pb-24">
      <div className="border-b border-sky-200/80 bg-white/90 backdrop-blur-sm">
        <div className="tk-container py-5 sm:py-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(redirectTo)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 sm:text-xl">{BRAND_NAME} Phone Verification</h1>
              <p className="text-xs text-slate-500">Verify your mobile number to use escrow.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="tk-container max-w-md py-8 sm:py-12">
        {/* Progress */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase ${step === "phone" || step === "otp" || step === "done" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-400"}`}>
            <Smartphone size={12} /> Enter number
          </div>
          <div className="h-px w-6 bg-slate-200" />
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase ${step === "otp" || step === "done" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-400"}`}>
            <Lock size={12} /> Enter OTP
          </div>
          <div className="h-px w-6 bg-slate-200" />
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase ${step === "done" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
            <CheckCircle size={12} /> Verified
          </div>
        </div>

        {step === "phone" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                <Smartphone size={20} className="text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Enter mobile number</p>
                <p className="text-xs text-slate-500">WhatsApp must be active on this number.</p>
              </div>
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              placeholder="03XXXXXXXXX"
              className="tk-input w-full text-center text-lg tracking-widest"
              type="tel"
            />
            <button
              type="button"
              disabled={busy || phone.replace(/\D/g, "").length < 10}
              onClick={handleSendOtp}
              className="tk-btn-primary mt-4 w-full"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : (
                <span className="flex items-center justify-center gap-2"><Send size={16} /> Send OTP</span>
              )}
            </button>
            <p className="mt-3 text-center text-[10px] text-slate-400">
              OTP will be sent to your WhatsApp by TrustKar admin within a few minutes.
            </p>
          </div>
        )}

        {step === "otp" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Lock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Enter OTP</p>
                <p className="text-xs text-slate-500">WhatsApp pe OTP check karein. Valid for 10 minutes.</p>
              </div>
            </div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              className="tk-input w-full text-center text-2xl tracking-[0.5em]"
              type="tel"
            />
            <button
              type="button"
              disabled={busy || otp.length !== 4}
              onClick={handleVerifyOtp}
              className="tk-btn-primary mt-4 w-full"
            >
              {busy ? <Loader2 className="animate-spin" size={18} /> : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); }}
              className="mt-2 w-full text-center text-xs font-bold text-slate-500 hover:text-sky-600"
            >
              Change number / Resend
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <ShieldCheck size={40} className="mx-auto text-emerald-600" />
            <p className="mt-3 text-base font-bold text-emerald-900">Phone verified</p>
            <p className="mt-1 text-sm text-emerald-700">You can now use escrow and post deals.</p>
            <button
              type="button"
              onClick={() => router.push(redirectTo)}
              className="tk-btn-primary mt-4"
            >
              Continue
            </button>
          </div>
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-24 left-1/2 z-[600] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg sm:bottom-8 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function KycPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin text-sky-600" />}>
      <KycForm />
    </Suspense>
  );
}
