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
        <div className="grid grid-cols-5 gap-1.5">
          {CATEGORY_TREE.map((cat) => {
            const iconKey = CATEGORY_ICONS[cat.id] || "layout-grid";
            const Icon = ICON_MAP[iconKey] || LayoutGrid;
            return (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.id}`}
                className="group flex flex-col items-center justify-center gap-1 p-1 text-center active:scale-[0.95] transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm group-hover:border-cyan-200 group-hover:shadow-md">
                  <Icon className="h-5 w-5 text-slate-500 group-hover:text-cyan-600" />
                </div>
                <span className="text-[8px] font-medium text-slate-600 leading-tight text-center w-full px-0.5 line-clamp-2">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop/Tablet: keep existing responsive grid (bilkul unchanged) */}
      <div className="hidden md:grid grid-cols-4 gap-2 lg:grid-cols-12 lg:gap-2">
        {CATEGORY_TREE.map((cat) => {
          const iconKey = CATEGORY_ICONS[cat.id] || "layout-grid";
          const Icon = ICON_MAP[iconKey] || LayoutGrid;
          return (
            <Link
              key={cat.id}
              href={`/browse?category=${cat.id}`}
              className="group flex flex-col items-center gap-1 rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md sm:rounded-2xl sm:p-2.5"
            >
              <Icon className="h-5 w-5 text-slate-500 transition group-hover:text-cyan-600 sm:h-6 sm:w-6" />
              <span className="line-clamp-2 text-center text-[9px] font-bold leading-tight text-slate-700 sm:text-[10px]">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
