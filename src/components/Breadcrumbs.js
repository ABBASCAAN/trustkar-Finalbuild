"use client";

import Link from "next/link";
import { CATEGORY_TREE } from "@/lib/categories";
import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ categoryId }) {
  if (!categoryId) return null;

  const cat = CATEGORY_TREE.find((c) => c.id === categoryId);
  if (!cat) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-500">
        <li>
          <Link href="/browse" className="hover:text-sky-700">All</Link>
        </li>
        <ChevronRight size={12} />
        <li>
          <Link href={`/browse?category=${cat.id}`} className="hover:text-sky-700">{cat.name}</Link>
        </li>
      </ol>
    </nav>
  );
}
