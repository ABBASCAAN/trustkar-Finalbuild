"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Search, MapPin, LayoutGrid } from "lucide-react";
import { CITIES } from "@/lib/constants";
import { CATEGORY_TREE } from "@/lib/categories";
import SearchableDropdown from "@/components/ui/SearchableDropdown";

export default function SearchBar({
  initialQuery = "",
  initialLocation = "",
  initialCategory = "",
  compact = false,
  className = "",
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [categoryId, setCategoryId] = useState(initialCategory);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All Categories" },
      ...CATEGORY_TREE.map((c) => ({ value: c.id, label: c.name })),
    ],
    []
  );

  const cityOptions = useMemo(
    () => [
      { value: "", label: "All Pakistan" },
      ...CITIES.map((c) => ({ value: c, label: c })),
    ],
    []
  );

  function handleSearch(term) {
    const q = (term ?? query).trim();
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    if (location) params.set("city", location);
    if (categoryId) params.set("category", categoryId);
    router.push(`/browse?${params.toString()}`);
  }

  return (
    <div className={`mx-auto max-w-3xl rounded-2xl border border-sky-200/80 bg-white p-2 shadow-xl shadow-sky-200/40 sm:rounded-full sm:p-2 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Mobile: category + location side-by-side; Desktop: inline row */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-0">
          <div className="relative z-[100] sm:w-[180px]">
            <SearchableDropdown
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
              placeholder="Category"
              icon={LayoutGrid}
              menuZIndex="z-[200]"
            />
          </div>
          <div className="hidden h-8 w-px bg-slate-200 sm:mx-2 sm:block" />
          <div className="relative z-[100] sm:w-[160px]">
            <SearchableDropdown
              value={location}
              onChange={setLocation}
              options={cityOptions}
              placeholder="City"
              icon={MapPin}
              menuZIndex="z-[200]"
            />
          </div>
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-full bg-slate-50 px-3 py-2 sm:bg-transparent sm:py-0">
          <Search size={18} className="hidden shrink-0 text-sky-600 sm:block" />
          <input
            type="text"
            placeholder="Search phones, laptops, parts…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
          />
        </div>
        <button type="button" onClick={() => handleSearch()} className="tk-btn-primary w-full shrink-0 sm:w-auto">
          Search
        </button>
      </div>
    </div>
  );
}
