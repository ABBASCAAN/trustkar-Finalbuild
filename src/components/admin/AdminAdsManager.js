"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { deleteAd, setAdFeatured } from "@/lib/firestore-helpers";
import { useToast } from "@/context/ToastContext";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
} from "lucide-react";

const SORTS = [
  { id: "date_desc", label: "Newest" },
  { id: "date_asc", label: "Oldest" },
  { id: "price_asc", label: "Price low" },
  { id: "price_desc", label: "Price high" },
];

const PER_PAGE = 20;

export default function AdminAdsManager({ ads, users, onRefresh }) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = [...ads];
    const t = search.trim().toLowerCase();
    if (t) {
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(t) ||
          a.id === t ||
          a.listingId?.toLowerCase() === t ||
          (a.sellerId && users.find((u) => u.uid === a.sellerId && (u.email || "").toLowerCase().includes(t)))
      );
    }
    switch (sort) {
      case "date_asc":
        list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        break;
      case "price_asc":
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
    return list;
  }, [ads, search, sort, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function handleDelete(adId) {
    if (!confirm("Delete this ad?")) return;
    try {
      await deleteAd(adId);
      showToast("Ad deleted", "success");
      onRefresh();
    } catch (e) {
      showToast("Failed to delete", "error");
    }
  }

  async function toggleFeature(ad) {
    try {
      await setAdFeatured(ad.id, { featured: !ad.featured, feeAmount: 500 });
      showToast(ad.featured ? "Unfeatured" : "Featured", "success");
      onRefresh();
    } catch (e) {
      showToast("Failed", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Email, title, or ad ID"
            className="tk-input !py-2 text-sm"
          />
          <button type="button" className="tk-btn-primary !px-3 !py-2">
            <Search size={16} />
          </button>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="tk-input !w-auto !py-2 text-xs">
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-500">{filtered.length} ads · Page {page} of {totalPages}</p>

      <ul className="space-y-2">
        {paged.map((ad) => (
          <li key={ad.id} className="tk-card flex flex-wrap items-center justify-between gap-3 !p-3">
            <Link href={`/ad/${ad.id}`} className="flex items-center gap-3 transition hover:opacity-80">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <Image src={ad.mainImage || ad.images?.[0] || "/placeholder-ad.svg"} alt="" fill className="object-cover" unoptimized />
              </div>
              <div>
                <p className="font-bold text-sm">{ad.title}</p>
                <p className="text-xs text-slate-500">{ad.city} · {ad.status} · {formatPrice(ad.price)}</p>
              </div>
            </Link>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleFeature(ad)}
                className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800"
              >
                <Sparkles size={12} className="inline" /> {ad.featured ? "Unfeature" : "Feature"}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(ad.id)}
                className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
              >
                <Trash2 size={12} className="inline" /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-bold text-slate-600">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold disabled:opacity-40"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

    </div>
  );
}
