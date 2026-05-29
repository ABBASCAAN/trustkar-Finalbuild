"use client";

import Link from "next/link";
import { CATEGORY_TREE } from "@/lib/categories";
import { ChevronRight } from "lucide-react";

export default function HomeCategoryRibbon() {
  return (
    <section className="border-y border-slate-200/80 bg-white">
      <div className="tk-container flex items-center gap-3 py-2.5 sm:py-3">
        <Link
          href="/browse"
          className="shrink-0 text-[11px] font-black uppercase tracking-wider text-sky-700 sm:text-xs"
        >
          All categories
        </Link>
        <span className="h-4 w-px shrink-0 bg-slate-200" aria-hidden />
        <div className="flex flex-1 items-center gap-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORY_TREE.map((cat, i) => (
            <span key={cat.id} className="flex shrink-0 items-center">
              {i > 0 && (
                <span className="mx-2 text-slate-300 select-none" aria-hidden>
                  ·
                </span>
              )}
              <Link
                href={`/browse?category=${cat.id}`}
                className="whitespace-nowrap text-[12px] font-semibold text-slate-600 transition hover:text-sky-700 sm:text-[13px]"
              >
                {cat.name}
              </Link>
            </span>
          ))}
        </div>
        <Link
          href="/browse"
          className="hidden shrink-0 items-center gap-0.5 text-xs font-bold text-sky-700 hover:underline sm:flex"
        >
          View all <ChevronRight size={14} />
        </Link>
      </div>
    </section>
  );
}
