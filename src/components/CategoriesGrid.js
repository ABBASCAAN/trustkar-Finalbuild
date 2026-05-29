"use client";

import Link from "next/link";
import {
  Smartphone,
  Laptop,
  Gamepad2,
  Headphones,
  Watch,
  Camera,
  Monitor,
  Refrigerator,
  Sofa,
  Shirt,
  Gem,
  Heart,
  Baby,
  Dumbbell,
  BookOpen,
  Wrench,
  Cog,
  Bike,
  Music,
  PawPrint,
  Briefcase,
  CreditCard,
  Palette,
  LayoutGrid,
} from "lucide-react";
import { CATEGORY_TREE, CATEGORY_ICONS } from "@/lib/categories";

const ICON_MAP = {
  smartphone: Smartphone,
  laptop: Laptop,
  gamepad: Gamepad2,
  headphones: Headphones,
  watch: Watch,
  camera: Camera,
  monitor: Monitor,
  refrigerator: Refrigerator,
  sofa: Sofa,
  shirt: Shirt,
  gem: Gem,
  heart: Heart,
  baby: Baby,
  dumbbell: Dumbbell,
  book: BookOpen,
  wrench: Wrench,
  cog: Cog,
  bike: Bike,
  music: Music,
  paw: PawPrint,
  briefcase: Briefcase,
  "credit-card": CreditCard,
  palette: Palette,
};

export default function CategoriesGrid() {
  return (
    <section>
      <h2 className="tk-section-title mb-3 text-base sm:text-lg">Explore Categories</h2>

      {/* Mobile: Grid version with 5 columns for professional, compact look */}
      <div className="md:hidden">
        <div className="grid grid-cols-5 gap-2">
          {CATEGORY_TREE.map((cat) => {
            const iconKey = CATEGORY_ICONS[cat.id] || "layout-grid";
            const Icon = ICON_MAP[iconKey] || LayoutGrid;
            return (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.id}`}
                className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-100 bg-white p-1.5 text-center shadow-sm transition active:scale-[0.95] hover:border-cyan-200 hover:shadow-md min-h-[76px]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 transition group-hover:bg-sky-50">
                  <Icon className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-600" />
                </div>
                <span className="line-clamp-2 w-full text-center text-[8px] font-semibold leading-tight text-slate-600">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop/Tablet: responsive grid with consistent centered cards */}
      <div className="hidden md:grid grid-cols-4 gap-3 lg:grid-cols-12 lg:gap-3">
        {CATEGORY_TREE.map((cat) => {
          const iconKey = CATEGORY_ICONS[cat.id] || "layout-grid";
          const Icon = ICON_MAP[iconKey] || LayoutGrid;
          return (
            <Link
              key={cat.id}
              href={`/browse?category=${cat.id}`}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md lg:p-3.5 min-h-[96px] lg:min-h-[104px]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 transition group-hover:bg-sky-50">
                <Icon className="h-5 w-5 text-slate-500 transition group-hover:text-cyan-600 lg:h-6 lg:w-6" />
              </div>
              <span className="line-clamp-2 w-full text-center text-[9px] font-bold leading-tight text-slate-700 lg:text-[10px]">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
