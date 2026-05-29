"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, BRAND_NAME } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import {
  Loader2,
  CheckCircle,
  Smartphone,
  Mail,
  CreditCard,
  Camera,
  ShieldCheck,
  ArrowLeft,
  Upload,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function StepBadge({ done, label, icon: Icon }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500"}`}>
      {done ? <CheckCircle size={14} /> : <Icon size={14} />}
      {label}
    </div>
  );
}

function KycForm() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [cnic, setCnic] = useState(profile?.cnic || "");
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(profile?.selfieUrl || null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (profile) {
      setCnic(profile.cnic || "");
      setSelfiePreview(profile.selfieUrl || null);
    }
  }, [profile]);

  async function verifyPhone() {
    if (phoneOtp.length !== 6) return showToast("Enter 6-digit OTP", "error");
    setBusy(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), { phoneVerified: true });
      await refreshProfile();
      showToast("Phone verified successfully");
      setPhoneOtp("");
    } catch {
      showToast("Verification failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmail() {
    if (emailOtp.length !== 6) return showToast("Enter 6-digit OTP", "error");
    setBusy(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), { emailVerified: true });
      await refreshProfile();
      showToast("Email verified successfully");
      setEmailOtp("");
    } catch {
      showToast("Verification failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveCnic() {
    if (!cnic.trim() || cnic.length < 13) return showToast("Enter valid CNIC (13 digits)", "error");
    setBusy(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), { cnic: cnic.trim(), cnicVerified: true });
      await refreshProfile();
      showToast("CNIC saved & verified");
    } catch {
      showToast("Failed to save CNIC", "error");
    } finally {
      setBusy(false);
    }
  }

  async function uploadSelfie() {
    if (!selfieFile) return showToast("Select a selfie first", "error");
    setBusy(true);
    try {
      const up = await uploadImageToCloudinary(selfieFile, { folder: "trustkar/selfies" });
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), { selfieUrl: up.secureUrl, selfieVerified: true });
      await refreshProfile();
      setSelfiePreview(up.secureUrl);
      showToast("Selfie uploaded & verified");
    } catch {
      showToast("Selfie upload failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const isPhoneDone = profile?.phoneVerified;
  const isEmailDone = profile?.emailVerified;
  const isCnicDone = profile?.cnicVerified;
  const isSelfieDone = profile?.selfieVerified;
  const allDone = isPhoneDone && isEmailDone && isCnicDone && isSelfieDone;

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
              <h1 className="text-lg font-black text-slate-900 sm:text-xl">{BRAND_NAME} Identity Verification</h1>
              <p className="text-xs text-slate-500">Complete all steps to unlock escrow and high-value deals.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="tk-container max-w-xl py-6 sm:py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <StepBadge done={isPhoneDone} label="Phone" icon={Smartphone} />
          <StepBadge done={isEmailDone} label="Email" icon={Mail} />
          <StepBadge done={isCnicDone} label="CNIC" icon={CreditCard} />
          <StepBadge done={isSelfieDone} label="Selfie" icon={Camera} />
        </div>

        {allDone && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <ShieldCheck size={24} className="text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-900">Verification complete</p>
              <p className="text-xs text-emerald-700">You can now use escrow for any deal value.</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-sky-600" />
              <p className="text-sm font-bold text-slate-900">Phone verification</p>
              {isPhoneDone && <CheckCircle size={16} className="ml-auto text-emerald-500" />}
            </div>
            {isPhoneDone ? (
              <p className="mt-2 text-xs text-emerald-700">Phone verified.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-500">Demo: enter any 6 digits.</p>
                <input
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="tk-input w-full tracking-widest"
                />
                <button type="button" disabled={busy} onClick={verifyPhone} className="tk-btn-primary w-full text-sm">
                  {busy ? <Loader2 className="animate-spin" size={16} /> : "Verify Phone"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-sky-600" />
              <p className="text-sm font-bold text-slate-900">Email verification</p>
              {isEmailDone && <CheckCircle size={16} className="ml-auto text-emerald-500" />}
            </div>
            {isEmailDone ? (
              <p className="mt-2 text-xs text-emerald-700">Email verified.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-xs text-slate-500">Demo: enter any 6 digits.</p>
                <input
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="tk-input w-full tracking-widest"
                />
                <button type="button" disabled={busy} onClick={verifyEmail} className="tk-btn-primary w-full text-sm">
                  {busy ? <Loader2 className="animate-spin" size={16} /> : "Verify Email"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-sky-600" />
              <p className="text-sm font-bold text-slate-900">CNIC verification</p>
              {isCnicDone && <CheckCircle size={16} className="ml-auto text-emerald-500" />}
            </div>
            {isCnicDone ? (
              <p className="mt-2 text-xs text-emerald-700">CNIC verified: {profile?.cnic}</p>
            ) : (
              <div className="mt-3 space-y-3">
                <input
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value.replace(/\D/g, "").slice(0, 13))}
                  placeholder="13-digit CNIC without dashes"
                  className="tk-input w-full"
                />
                <button type="button" disabled={busy} onClick={saveCnic} className="tk-btn-primary w-full text-sm">
                  {busy ? <Loader2 className="animate-spin" size={16} /> : "Save & Verify CNIC"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-sky-600" />
              <p className="text-sm font-bold text-slate-900">Selfie verification</p>
              {isSelfieDone && <CheckCircle size={16} className="ml-auto text-emerald-500" />}
            </div>
            {isSelfieDone && selfiePreview ? (
              <div className="mt-3">
                <div className="relative h-32 w-32 overflow-hidden rounded-xl">
                  <Image src={selfiePreview} alt="Selfie" fill className="object-cover" unoptimized />
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50">
                  <Upload size={16} /> Upload selfie (clear face photo)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelfieFile(file || null);
                      if (file) setSelfiePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
                {selfiePreview && (
                  <div className="relative h-32 w-32 overflow-hidden rounded-xl">
                    <Image src={selfiePreview} alt="Preview" fill className="object-cover" unoptimized />
                  </div>
                )}
                <button type="button" disabled={busy || !selfieFile} onClick={uploadSelfie} className="tk-btn-primary w-full text-sm">
                  {busy ? <Loader2 className="animate-spin" size={16} /> : "Upload Selfie"}
                </button>
              </div>
            )}
          </div>
        </div>
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
