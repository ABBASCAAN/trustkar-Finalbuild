"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { subscribeActiveAds } from "@/lib/firestore-helpers";
import { CATEGORY_TREE } from "@/lib/categories";
import AdCard from "@/components/AdCard";
import { ArrowRight } from "lucide-react";

const TOP_CATEGORY_IDS = ["mobiles", "laptops", "gaming", "audio", "wearables"];

function SkeletonRow() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomeCategoryRows() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeActiveAds(
      (list) => {
        setAds(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  const categoryMap = useMemo(() => {
    const map = {};
    for (const cat of CATEGORY_TREE) {
      map[cat.id] = cat.name;
    }
    return map;
  }, []);

  const rows = useMemo(() => {
    const result = [];
    for (const catId of TOP_CATEGORY_IDS) {
      const catAds = ads.filter((a) => a.categoryId === catId);
      if (catAds.length === 0) continue;
      // Featured first, then newest
      const sorted = [...catAds].sort((a, b) => {
        const fa = a.featured === true ? 1 : 0;
        const fb = b.featured === true ? 1 : 0;
        if (fb !== fa) return fb - fa;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      result.push({
        id: catId,
        name: categoryMap[catId] || catId,
        ads: sorted.slice(0, 4),
        total: sorted.length,
      });
    }
    return result;
  }, [ads, categoryMap]);

  if (loading) {
    return (
      <div className="tk-container space-y-8 py-5 sm:py-7">
        {TOP_CATEGORY_IDS.slice(0, 3).map((id) => (
          <div key={id}>
            <div className="mb-3 flex items-center justify-between">
              <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
            </div>
            <SkeletonRow />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) return null;

  return (
    <div className="tk-container space-y-8 py-5 sm:space-y-10 sm:py-7">
      {rows.map((row) => (
        <section key={row.id}>
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 sm:text-lg">{row.name}</h2>
              <p className="text-[11px] text-slate-500 sm:text-xs">
                {row.total} listing{row.total !== 1 ? "s" : ""} · escrow protected
              </p>
            </div>
            <Link
              href={`/browse?category=${row.id}`}
              className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-sky-700 shadow-sm ring-1 ring-sky-200 transition hover:bg-sky-50 sm:text-sm"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {row.ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} showPrice />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
