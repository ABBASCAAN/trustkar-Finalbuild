"use client";

import Link from "next/link";
import { CATEGORY_TREE } from "@/lib/categories";
import { usePathname, useSearchParams } from "next/navigation";

export default function CategoryBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCat = searchParams.get("category") || "";

  return (
    <div className="hidden md:block border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3">
        <div className="flex gap-2">
          <Link
            href="/"
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              pathname === "/" && !activeCat
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All
          </Link>
          {CATEGORY_TREE.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCat === cat.id || pathname === `/category/${cat.id}`
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
