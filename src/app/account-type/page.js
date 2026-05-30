"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  User,
  Briefcase,
  Shield,
  ArrowRight,
  Store,
  Package,
  Star,
  Loader2,
} from "lucide-react";

export default function AccountTypePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?redirect=/account-type");
    }
    if (!loading && profile?.accountType) {
      router.replace("/");
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-700 text-white shadow-lg">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
            Choose Your Account Type
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Select how you want to use the platform.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Personal Account */}
          <Link
            href="/welcome-personal"
            className="group relative flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-sky-300 hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 transition group-hover:bg-sky-100">
              <User size={32} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Personal Account</h2>
              <p className="mt-1 text-xs text-slate-500">
                Buy and sell items as an individual. Perfect for casual users.
              </p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-sky-600">
              Get Started <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Business Account */}
          <Link
            href="/business-setup"
            className="group relative flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50 transition group-hover:bg-cyan-100">
              <Briefcase size={32} className="text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Business Account</h2>
              <p className="mt-1 text-xs text-slate-500">
                Create a professional storefront. Manage products and grow your brand.
              </p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs font-bold text-cyan-600">
              Set Up Store <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </div>
            <span className="absolute right-3 top-3 flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200">
              <Star size={10} className="fill-amber-500 text-amber-500" /> Recommended
            </span>
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Shield size={12} className="text-sky-500" /> Escrow Protected
          </span>
          <span className="flex items-center gap-1">
            <Store size={12} className="text-sky-500" /> Free Storefront
          </span>
          <span className="flex items-center gap-1">
            <Package size={12} className="text-sky-500" /> Unlimited Listings
          </span>
        </div>
      </div>
    </div>
  );
}
