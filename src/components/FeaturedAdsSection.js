"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeActiveAds, pickFeaturedAds } from "@/lib/firestore-helpers";
import AdsGrid from "@/components/ads/AdsGrid";
import { Sparkles } from "lucide-react";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeaturedAdsSection() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeActiveAds(
      (list) => {
        setAds(pickFeaturedAds(list, 12));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  return (
    <section className="tk-container py-5 sm:py-7">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
            <Sparkles size={16} />
          </span>
          <div>
            <h2 className="text-base font-black text-slate-900 sm:text-lg">Featured ads</h2>
            <p className="text-[11px] text-slate-500 sm:text-xs">Escrow protected · Hand-picked listings</p>
          </div>
        </div>
        <Link href="/browse?featured=1" className="shrink-0 text-xs font-bold text-sky-700 hover:underline sm:text-sm">
          See all →
        </Link>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : ads.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center">
          <p className="font-bold text-slate-700">No featured ads yet</p>
          <p className="mt-1 text-sm text-slate-500">Featured listings will appear here once enabled by admin.</p>
          <Link href="/browse" className="mt-3 inline-block text-sm font-bold text-sky-700 hover:underline">
            Browse all listings
          </Link>
        </div>
      ) : (
        <AdsGrid ads={ads} showPrice />
      )}
    </section>
  );
}
