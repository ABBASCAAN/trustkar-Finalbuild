"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORY_TREE } from "@/lib/categories";

export default function QuickLinks() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto py-2">
          <Link
            href="/"
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-sky-600 text-white"
                : "text-gray-600 hover:bg-sky-50 hover:text-sky-800"
            }`}
          >
            All Categories
          </Link>
          {CATEGORY_TREE.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === `/category/${cat.id}`
                  ? "bg-sky-600 text-white"
                  : "text-gray-600 hover:bg-sky-50 hover:text-sky-800"
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
