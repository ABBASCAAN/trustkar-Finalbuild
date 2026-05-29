"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeActiveAds, pickTrendingAds } from "@/lib/firestore-helpers";
import AdsGrid from "@/components/ads/AdsGrid";
import { TrendingUp } from "lucide-react";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-5 lg:gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
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

export default function TrendingNowSection() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeActiveAds(
      (list) => {
        setAds(pickTrendingAds(list, 10));
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
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-sm">
            <TrendingUp size={16} />
          </span>
          <div>
            <h2 className="text-base font-black text-slate-900 sm:text-lg">Trending now</h2>
            <p className="text-[11px] text-slate-500 sm:text-xs">Most viewed · Recently active · Top picks</p>
          </div>
        </div>
        <Link
          href="/browse?sort=views"
          className="shrink-0 text-xs font-bold text-sky-700 hover:underline sm:text-sm"
        >
          View all →
        </Link>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : ads.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center">
          <p className="font-bold text-slate-700">No trending listings yet</p>
          <p className="mt-1 text-sm text-slate-500">Popular listings will appear here as views grow.</p>
          <Link href="/browse" className="mt-3 inline-block text-sm font-bold text-sky-700 hover:underline">
            Browse all listings
          </Link>
        </div>
      ) : (
        <AdsGrid ads={ads} showPrice desktopCols="lg:grid-cols-5" />
      )}
    </section>
  );
}
