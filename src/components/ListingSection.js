"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import AdCard from "./AdCard";
import { Smartphone, Car, Home, Shirt, Sofa, Briefcase, LayoutGrid } from "lucide-react";

const SECTION_ICONS = {
  smartphone: Smartphone,
  car: Car,
  home: Home,
  shirt: Shirt,
  sofa: Sofa,
  briefcase: Briefcase,
};

export default function ListingSection({ title, ads, icon, iconName, categoryId, seeAllHref }) {
  const scrollRef = useRef(null);
  const viewHref = seeAllHref || (categoryId ? `/category/${categoryId}` : "/");
  const IconComp = iconName ? SECTION_ICONS[iconName] : null;

  function scroll(dir) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  if (!ads?.length) return null;

  return (
    <section className="tk-container relative py-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="tk-section-title flex items-center gap-2">
          {icon}
          {IconComp && <IconComp className="h-5 w-5 text-cyan-600" />}
          {title}
        </h2>
        <Link href={viewHref} className="text-sm font-bold text-cyan-600 hover:underline">
          See all
        </Link>
      </div>
      <div className="relative">
        <button type="button" onClick={() => scroll(-1)} className="absolute -left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow md:flex" aria-label="Previous">
          <ChevronLeft size={18} />
        </button>
        <div ref={scrollRef} className="tk-slider">
          {ads.map((ad) => (
            <div key={ad.id} className="w-[220px] shrink-0 sm:w-[260px]">
              <AdCard ad={ad} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => scroll(1)} className="absolute -right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white shadow md:flex" aria-label="Next">
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}
