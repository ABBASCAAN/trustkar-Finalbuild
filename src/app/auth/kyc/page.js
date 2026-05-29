"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, BRAND_NAME } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

function KycForm() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [authLoading, user, router, redirectTo]);

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  async function verifyPhone() {
    if (otp.length !== 6) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), { phoneVerified: true });
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="tk-container py-20 text-center">
        <Link href="/auth/login?redirect=/auth/kyc" className="text-sky-600">
          Sign in to verify identity
        </Link>
      </div>
    );
  }

  return (
    <div className="tk-container max-w-lg py-10 text-center">
      <h1 className="text-2xl font-black">{BRAND_NAME} Verification</h1>
      <p className="mt-2 text-sm text-slate-600">
        We only need your phone number for escrow. Complete it below.
      </p>

      {profile?.phoneVerified ? (
        <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-900">
          <CheckCircle className="text-sky-600" size={20} />
          Phone verified — you can buy with escrow.
        </div>
      ) : (
        <div className="mt-8 space-y-4 text-left">
          <p className="text-xs text-slate-500">Demo: enter any 6 digits.</p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="tk-input tracking-widest"
          />
          <button type="button" disabled={busy} onClick={verifyPhone} className="tk-btn-primary w-full">
            {busy ? <Loader2 className="animate-spin" size={16} /> : "Verify Phone"}
          </button>
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
