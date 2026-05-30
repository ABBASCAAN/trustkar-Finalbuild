"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Lock,
  Eye,
  Handshake,
  Loader2,
} from "lucide-react";

export default function WelcomePersonalPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?redirect=/welcome-personal");
    }
  }, [user, loading, router]);

  async function proceed() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
        accountType: "personal",
        onboardingComplete: true,
        updatedAt: serverTimestamp(),
      });
      router.replace("/");
    } catch {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-sky-50 via-white to-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Animated badge */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-700 text-white shadow-xl">
              <Shield size={36} />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
              <CheckCircle size={16} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-lg sm:p-8">
          <h1 className="text-center text-xl font-black leading-tight text-slate-900 sm:text-2xl">
            We Welcome You To The Future Of Online Anti Scam Marketplace
          </h1>
          <p className="mt-2 text-center text-sm font-bold text-sky-700">
            Apka Paisa Hamari Amanat
          </p>

          {/* Trust visuals */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                <Lock size={18} className="text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Escrow Protected</p>
                <p className="text-xs text-slate-500">Your payment is held safely until you receive the item.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <Eye size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Inspection Period</p>
                <p className="text-xs text-slate-500">24 hours to inspect before releasing payment.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Handshake size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Trusted Community</p>
                <p className="text-xs text-slate-500">Buy and sell with verified sellers across Pakistan.</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={proceed}
            disabled={saving}
            className="tk-btn-primary mt-6 flex w-full items-center justify-center gap-2 !py-3.5 text-sm font-bold"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Proceed To Home Page <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
