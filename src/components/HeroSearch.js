"use client";

import { BRAND_NAME } from "@/lib/constants";
import SearchBar from "@/components/SearchBar";

export default function HeroSearch() {
  return (
    <section className="relative overflow-visible bg-gradient-to-b from-[#ecf7ff] via-[#e8f8ff] to-[var(--tk-bg)] px-4 pb-5 pt-5 sm:pb-7 sm:pt-7">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="relative z-[80] mx-auto max-w-4xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-900">
          🇵🇰 Made for Pakistan
        </p>
        <h1 className="text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem]">
          Buy & sell safely on <span className="text-sky-700">{BRAND_NAME}</span>
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs text-slate-600 sm:mt-3 sm:text-base">
          Escrow-protected marketplace for verified buying and selling across Pakistan
        </p>

        <SearchBar className="relative z-[90] mt-5 sm:mt-7" />
      </div>
    </section>
  );
}
