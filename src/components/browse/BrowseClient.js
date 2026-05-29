"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { subscribeActiveAds } from "@/lib/firestore-helpers";
import { CATEGORY_TREE } from "@/lib/categories";
import { CONDITIONS, CITIES, SORT_OPTIONS } from "@/lib/constants";
import AdCard from "@/components/AdCard";
import AdsGrid from "@/components/ads/AdsGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import SkeletonCard from "@/components/SkeletonCard";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import {
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Loader2,
  X,
  Star,
  MapPin,
} from "lucide-react";
import { formatPrice, formatTimeAgo, getConditionBadgeClass, cn } from "@/lib/utils";
import Image from "next/image";
import { useIsMobile } from "@/hooks/useIsMobile";
import SearchBar from "@/components/SearchBar";

function BrowseInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);
  const isMobile = useIsMobile();

  const q = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const categoryId = searchParams.get("category") || "";
  const minPrice = searchParams.get("min") || "";
  const maxPrice = searchParams.get("max") || "";
  const condition = searchParams.get("condition") || "";
  const brand = searchParams.get("brand") || "";
  const negotiable = searchParams.get("negotiable") || "";
  const featuredOnly = searchParams.get("featured") || "";
  const sellerTrustMin = searchParams.get("trustMin") || "";
  const sort = searchParams.get("sort") || "newest";
  const view = searchParams.get("view") || "grid";
  const effectiveView = isMobile ? "list" : view;
  const [localSearch, setLocalSearch] = useState(q);

  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeActiveAds((list) => {
      setAds(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...CATEGORY_TREE.map((c) => ({ value: c.id, label: c.name })),
    ],
    []
  );

  const availableCategories = useMemo(() => {
    const ids = new Set(ads.map((a) => a.categoryId).filter(Boolean));
    return CATEGORY_TREE.filter((c) => ids.has(c.id));
  }, [ads]);

  const availableBrands = useMemo(() => {
    const set = new Set();
    for (const a of ads) {
      if (a.brand) set.add(String(a.brand).trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b)).slice(0, 30);
  }, [ads]);

  function pushFilters(updates) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === "" || v == null) params.delete(k);
      else params.set(k, v);
    });
    router.push(`/browse?${params.toString()}`);
  }

  const filtered = useMemo(() => {
    let list = [...ads];
    const term = (q || localSearch).trim().toLowerCase();
    if (term) {
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(term) ||
          a.description?.toLowerCase().includes(term) ||
          a.listingId?.toLowerCase().includes(term) ||
          a.brand?.toLowerCase().includes(term) ||
          a.categoryName?.toLowerCase().includes(term)
      );
    }
    if (city) {
      list = list.filter(
        (a) =>
          a.city?.toLowerCase() === city.toLowerCase() ||
          a.location?.toLowerCase() === city.toLowerCase()
      );
    }
    if (categoryId) list = list.filter((a) => a.categoryId === categoryId);

    if (condition) list = list.filter((a) => a.condition === condition);

    if (brand) {
      const b = brand.trim().toLowerCase();
      list = list.filter(
        (a) =>
          (a.brand || "").toLowerCase().includes(b) ||
          (a.model || "").toLowerCase().includes(b)
      );
    }

    if (negotiable === "1") list = list.filter((a) => Boolean(a.negotiable) === true);
    if (featuredOnly === "1") list = list.filter((a) => Boolean(a.featured) === true);

    if (sellerTrustMin) {
      const t = Number(sellerTrustMin);
      if (!Number.isNaN(t)) list = list.filter((a) => (a.sellerTrustRating || 0) >= t);
    }
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (minPrice && !Number.isNaN(min)) list = list.filter((a) => (a.price || 0) >= min);
    if (maxPrice && !Number.isNaN(max)) list = list.filter((a) => (a.price || 0) <= max);

    switch (sort) {
      case "views":
        list.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case "price_asc":
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        list.sort((a, b) => {
          const featDiff = Number(b.featured === true) - Number(a.featured === true);
          if (featDiff !== 0) return featDiff;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
    }
    return list;
  }, [
    ads,
    q,
    localSearch,
    city,
    categoryId,
    condition,
    brand,
    negotiable,
    featuredOnly,
    sellerTrustMin,
    minPrice,
    maxPrice,
    sort,
  ]);

  const FiltersPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Category</label>
        <SearchableDropdown
          value={categoryId}
          onChange={(v) => pushFilters({ category: v })}
          options={categoryOptions}
          placeholder="All"
          hoverOpen={false}
        />
        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto">
          {availableCategories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => pushFilters({ category: c.id })}
                className={`w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold ${
                  categoryId === c.id ? "bg-sky-100 text-sky-900" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-slate-500">City</label>
        <SearchableDropdown
          value={city}
          onChange={(v) => pushFilters({ city: v })}
          options={[
            { value: "", label: "All Pakistan" },
            ...CITIES.map((c) => ({ value: c, label: c })),
          ]}
          placeholder="All"
          hoverOpen={false}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Price (PKR)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => pushFilters({ min: e.target.value })}
            className="tk-input !py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => pushFilters({ max: e.target.value })}
            className="tk-input !py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Condition</label>
        <select
          value={condition}
          onChange={(e) => pushFilters({ condition: e.target.value })}
          className="tk-input !py-2 text-sm"
        >
          <option value="">Any</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Brand / Model</label>
        <input
          value={brand}
          onChange={(e) => pushFilters({ brand: e.target.value })}
          placeholder="e.g. Samsung, iPhone…"
          className="tk-input !py-2 text-sm"
          list="tk-brand-suggestions"
        />
        <datalist id="tk-brand-suggestions">
          {availableBrands.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-3 text-xs font-bold uppercase text-slate-500">
          <input
            type="checkbox"
            checked={negotiable === "1"}
            onChange={(e) => pushFilters({ negotiable: e.target.checked ? "1" : "" })}
          />
          Negotiable only
        </label>

        <label className="flex items-center gap-3 text-xs font-bold uppercase text-slate-500">
          <input
            type="checkbox"
            checked={featuredOnly === "1"}
            onChange={(e) => pushFilters({ featured: e.target.checked ? "1" : "" })}
          />
          Featured only
        </label>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Seller trust min</label>
          <select
            value={sellerTrustMin}
            onChange={(e) => pushFilters({ trustMin: e.target.value })}
            className="tk-input !py-2 text-sm"
          >
            <option value="">Any</option>
            <option value="4.5">4.5+ (very trusted)</option>
            <option value="4.0">4.0+ (trusted)</option>
            <option value="3.0">3.0+ (good)</option>
            <option value="0.0">0.0+ (any)</option>
          </select>
        </div>
      </div>

      {(categoryId || minPrice || maxPrice || q || condition || brand || negotiable || featuredOnly || sellerTrustMin || city) && (
        <button
          type="button"
          onClick={() => router.push("/browse")}
          className="flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600"
        >
          <X size={14} /> Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--tk-bg)]">
      <div className="border-b border-sky-200/60 bg-gradient-to-r from-sky-50 to-cyan-50 md:bg-gradient-to-r">
        <div className="tk-container py-4 sm:py-6">
          <Breadcrumbs categoryId={categoryId} />
          <h1 className="text-xl font-black text-slate-900 sm:text-3xl">Browse listings</h1>
          <p className="mt-0.5 text-xs text-slate-600 sm:mt-1 sm:text-sm">
            {loading ? "Loading…" : `${filtered.length} ads`} · escrow protected
          </p>
          <SearchBar
            initialQuery={q}
            initialLocation={city}
            initialCategory={categoryId}
            className="mt-4"
          />
        </div>
      </div>

      <div className="tk-container py-4 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-bold lg:hidden"
            onClick={() => setMobileFilters(true)}
          >
            <SlidersHorizontal size={16} /> Filters
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(e) => pushFilters({ sort: e.target.value })}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="hidden rounded-full border border-slate-200 bg-white p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => pushFilters({ view: "grid" })}
                className={`rounded-full p-2 ${view === "grid" ? "bg-sky-600 text-white" : "text-slate-500"}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => pushFilters({ view: "list" })}
                className={`rounded-full p-2 ${view === "list" ? "bg-sky-600 text-white" : "text-slate-500"}`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 tk-card !p-4">
              <h2 className="mb-4 font-bold text-slate-900">Filters</h2>
              <FiltersPanel />
            </div>
          </aside>

          <div>
            {loading ? (
              <div className={effectiveView === "list" ? "space-y-3" : "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3"}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="tk-card py-16 text-center">
                <p className="font-bold text-slate-700">No ads match your filters</p>
                <Link href="/browse" className="mt-3 inline-block text-sm font-bold text-sky-700">
                  View all listings
                </Link>
              </div>
            ) : effectiveView === "list" ? (
              <ul className="space-y-3">
                {filtered.map((ad) => (
                  <li key={ad.id}>
                    <Link
                      href={`/ad/${ad.id}`}
                      className="tk-card flex gap-3 !p-3 transition hover:border-cyan-300 sm:gap-4"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
                        <Image
                          src={ad.mainImage || ad.images?.[0] || "/placeholder-ad.svg"}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {ad.featured && (
                          <span className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-[8px] font-bold text-white shadow">
                            <Star size={10} className="fill-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-bold text-slate-900">{ad.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {ad.condition && (
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", getConditionBadgeClass(ad.condition))}>
                              {ad.condition}
                            </span>
                          )}
                          {ad.featured && (
                            <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 ring-1 ring-amber-200">
                              <Star size={8} className="fill-amber-500 text-amber-500" /> Featured
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 font-black text-sky-700">{formatPrice(ad.price)}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-0.5">
                            <MapPin size={11} className="shrink-0 text-cyan-600" />
                            {ad.city || ad.location || "Pakistan"}
                          </span>
                          {ad.createdAt?.seconds && (
                            <span className="text-slate-400">· {formatTimeAgo(ad.createdAt.seconds)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <AdsGrid ads={filtered} showPrice desktopCols="lg:grid-cols-3" />
            )}
          </div>
        </div>
      </div>

      {mobileFilters && (
        <div className="fixed inset-0 z-[300] flex flex-col lg:hidden">
          <button type="button" className="flex-1 bg-slate-900/50" onClick={() => setMobileFilters(false)} />
          <div className="max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(5.5rem+var(--safe-bottom))]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Filters</h2>
              <button type="button" onClick={() => setMobileFilters(false)}>
                <X />
              </button>
            </div>
            <FiltersPanel />
            <button type="button" className="tk-btn-primary mt-6 w-full" onClick={() => setMobileFilters(false)}>
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrowseClient() {
  return (
    <Suspense
          fallback={
        <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        </div>
      }
    >
      <BrowseInner />
    </Suspense>
  );
}
