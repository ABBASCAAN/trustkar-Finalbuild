"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { CATEGORY_TREE } from "@/lib/categories";

export default function StickySearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState(searchParams.get("search") || "");
  const [showCats, setShowCats] = useState(false);

  useEffect(() => {
    setMounted(true);
    const h = () => setScrolled(window.scrollY > 120);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  function submit() {
    if (!query.trim()) return;
    router.push(`/browse?search=${encodeURIComponent(query.trim())}`);
    setShowCats(false);
  }

  // Index page already has a big search with categories/cities
  // Wait for mount to avoid hydration mismatch (pathname is null during SSR)
  if (!mounted || pathname === "/") return null;
  if (!scrolled) return null;

  return (
    <div className="sticky top-14 z-[450] border-b border-sky-100 bg-white/95 backdrop-blur-md shadow-sm md:top-[64px]">
      <div className="tk-container flex items-center gap-2 py-2">
        <div className="flex flex-1 items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Search listings…"
            className="tk-input !py-2 text-sm"
          />
          <button type="button" onClick={submit} className="tk-btn-primary !px-3 !py-2">
            <Search size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowCats(!showCats)}
          className="hidden rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 md:flex"
        >
          <SlidersHorizontal size={14} className="mr-1" />
          Categories
        </button>
        {showCats && (
          <div className="absolute left-0 right-0 top-full z-[460] border-b border-slate-200 bg-white shadow-lg">
            <div className="tk-container flex flex-wrap gap-2 py-3">
              {CATEGORY_TREE.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/browse?category=${cat.id}`}
                  onClick={() => setShowCats(false)}
                  className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-100"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
