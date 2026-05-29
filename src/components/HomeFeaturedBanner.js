"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { subscribeSponsoredBanners } from "@/lib/firestore-helpers";
import { Sparkles } from "lucide-react";

export default function HomeFeaturedBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const unsub = subscribeSponsoredBanners((list) => {
      const featured = list.find((b) => b.slot === "featured_main" && b.active !== false);
      setBanner(featured || null);
    });
    return () => unsub();
  }, []);

  if (!banner) return null;

  return (
    <section className="tk-container py-2 sm:py-3">
      <Link
        href="/featured-ads"
        className="group relative block overflow-hidden rounded-2xl sm:rounded-3xl"
      >
        {/* Background image fills the whole card */}
        <div className="relative h-[160px] w-full overflow-hidden sm:h-[200px] md:h-[240px]">
          {banner.imageUrl ? (
            <Image
              src={banner.imageUrl}
              alt={banner.title || "Featured ads"}
              fill
              className="object-cover object-left transition duration-700 group-hover:scale-105"
              priority
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-500">
              <p className="text-xl font-black text-white sm:text-3xl">{banner.title || "Featured Ads"}</p>
            </div>
          )}

          {/* Clickable banner — no overlay text */}
        </div>
      </Link>

      {/* CTA line below banner */}
      <Link href="/featured-ads" className="mt-2 block text-center text-[11px] font-semibold tracking-wide text-sky-700 sm:mt-2.5 sm:text-xs">
        Want your ad seen by thousands?{" "}
        <span className="inline-flex items-center gap-1 font-black underline underline-offset-2">
          Discover how it works
          <Sparkles size={12} className="text-amber-500" />
        </span>
      </Link>
    </section>
  );
}
