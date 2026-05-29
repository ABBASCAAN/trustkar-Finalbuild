"use client";

import AdCard from "@/components/AdCard";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

/**
 * Mobile: 4 compact cards per row (native app density).
 * Tablet/desktop: standard 2–4 column grid.
 */
export default function AdsGrid({ ads, showPrice = true, className, desktopCols = "lg:grid-cols-4" }) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "grid gap-1.5 sm:grid-cols-3 sm:gap-2.5 lg:gap-3",
        isMobile ? "grid-cols-4" : cn("grid-cols-2", desktopCols),
        className
      )}
    >
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} showPrice={showPrice} compact={isMobile} />
      ))}
    </div>
  );
}
