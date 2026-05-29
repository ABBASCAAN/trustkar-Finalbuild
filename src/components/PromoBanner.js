import Link from "next/link";
import { Shield, ArrowRight, TrendingUp, Lock } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";

export default function PromoBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-100 to-sky-200">
        <div className="flex flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row sm:px-10 sm:py-8">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-sky-600 p-3">
              <Shield size={28} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">{BRAND_NAME} Escrow</p>
              <h2 className="text-xl font-black text-sky-900 sm:text-2xl">Funds held until you verify</h2>
              <p className="text-sm font-medium text-sky-800/80">EasyPaisa · JazzCash · Bank Transfer</p>
            </div>
          </div>
          <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-600 sm:flex">
            <span className="text-lg font-black text-white">TK</span>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href="/post-ad"
              className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-sky-700"
            >
              Sell with Escrow
              <ArrowRight size={16} />
            </Link>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-sky-800">
                <TrendingUp size={14} /> Safe Payments
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-semibold text-sky-800">
                <Lock size={14} /> Dispute Support
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
