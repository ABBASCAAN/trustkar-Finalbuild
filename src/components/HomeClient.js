"use client";

import HeroSearch from "./HeroSearch";
import CategoriesGrid from "./CategoriesGrid";
import HomePromoSlots from "./HomePromoSlots";
import HomeCategoryRibbon from "./HomeCategoryRibbon";
import HomeFeaturedBanner from "./HomeFeaturedBanner";
import HomeCategoryRows from "./HomeCategoryRows";
import Link from "next/link";
import { Truck, Star, Handshake, Clock3 } from "lucide-react";

export default function HomeClient() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--tk-bg)]">
      <HeroSearch />

      {/* Brand slogan — English, enterprise feel */}
      <section className="tk-container pb-1 pt-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#053a78] via-[#0a5cad] to-[#0ea5e9] px-5 py-7 text-white shadow-lg shadow-sky-900/15 sm:rounded-3xl sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-200 sm:text-xs">
            TRUSTKAR.PK
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Buy with confidence.
            <br className="hidden sm:block" />
            <span className="text-sky-200"> Sell with peace of mind.</span>
          </h2>
          <p className="mt-2 max-w-xl text-xs text-sky-100/90 sm:text-sm">
            Pakistan&apos;s escrow-protected marketplace — verified listings, secure payments, and
            transparent deal tracking in one place.
          </p>
        </div>
      </section>

      <HomeCategoryRibbon />

      <section className="relative z-[1] tk-container py-3 sm:py-4">
        <CategoriesGrid />
      </section>

      <HomeFeaturedBanner />

      <HomeCategoryRows />
      <HomePromoSlots />

      <section className="tk-container pb-10 pt-2 sm:pb-12">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            [Handshake, "Escrow-first checkout", "Funds protected until buyer confirms"],
            [Clock3, "Milestone timeline", "Clear status from payment to release"],
            [Truck, "Courier ready", "Ship and track across Pakistan"],
            [Star, "Trust score system", "Ratings on every seller"],
          ].map(([Icon, title, sub]) => (
            <div
              key={title}
              className="rounded-xl border border-sky-100 bg-white p-3 text-center shadow-sm sm:rounded-2xl sm:p-4"
            >
              <Icon className="mx-auto h-6 w-6 text-cyan-600 sm:h-7 sm:w-7" />
              <p className="mt-1.5 text-[11px] font-bold text-slate-900 sm:text-sm">{title}</p>
              <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">{sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500 sm:mt-8 sm:text-sm">
          Ready to shop?{" "}
          <Link href="/browse" className="font-bold text-sky-700 hover:underline">
            Explore all listings
          </Link>
          {" · "}
          <Link href="/compare" className="font-bold text-sky-700 hover:underline">
            Why escrow matters
          </Link>
          {" · "}
          <Link href="/support#escrow-policy" className="font-bold text-sky-700 hover:underline">
            Escrow policy
          </Link>
        </p>
      </section>
    </div>
  );
}
