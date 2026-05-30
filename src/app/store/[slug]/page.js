"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  fetchBusinessBySlug,
  fetchStoreAds,
  fetchSellerReviews,
} from "@/lib/firestore-helpers";
import { formatPrice, getMemberSinceYears } from "@/lib/utils";
import { AD_STATUS } from "@/lib/constants";
import {
  Star,
  Shield,
  BadgeCheck,
  MapPin,
  Phone,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  Share2,
  MessageCircle,
  Store,
  Search,
  Loader2,
  Package,
  Eye,
  ExternalLink,
  Copy,
  CheckCircle,
} from "lucide-react";

export default function StoreFrontPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [ads, setAds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const b = await fetchBusinessBySlug(slug);
      if (!b) {
        setLoading(false);
        return;
      }
      setBusiness(b);
      const [a, r] = await Promise.all([
        fetchStoreAds(b.userId, { status: AD_STATUS.ACTIVE }),
        fetchSellerReviews(b.userId),
      ]);
      setAds(a);
      setReviews(r);
      setLoading(false);
    })();
  }, [slug]);

  const bestSellers = useMemo(() => ads.filter((a) => a.bestSeller).slice(0, 5), [ads]);

  const filteredAds = useMemo(() => {
    let list = [...ads];
    if (activeTab !== "all") {
      if (activeTab === "best") list = list.filter((a) => a.bestSeller);
      else list = list.filter((a) => a.categoryId === activeTab || a.sellerCategoryId === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title?.toLowerCase().includes(q));
    }
    return list;
  }, [ads, activeTab, search]);

  const categories = useMemo(() => {
    const map = new Map();
    ads.forEach((a) => {
      const cid = a.categoryId || "uncategorized";
      const name = a.categoryName || "Products";
      if (!map.has(cid)) map.set(cid, name);
    });
    return Array.from(map.entries());
  }, [ads]);

  function handleShare() {
    const url = `${window.location.origin}/store/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    const url = `${window.location.origin}/store/${slug}`;
    const text = `Check out this store on TrustKar: ${business?.businessName}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  if (loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <Store size={48} className="text-slate-300" />
        <h1 className="mt-4 text-xl font-black text-slate-700">Store not found</h1>
        <p className="mt-1 text-sm text-slate-500">This store does not exist or has been removed.</p>
        <Link href="/" className="tk-btn-primary mt-4">
          Back to Home
        </Link>
      </div>
    );
  }

  const trustRating = business.trustRating ?? 5.0;
  const reviewCount = business.reviewCount || reviews.length;
  const completedDeals = business.completedDeals || 0;
  const joinedYears = business.createdAt?.seconds
    ? getMemberSinceYears(business.createdAt.seconds)
    : "";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner */}
      <div className="relative h-40 w-full overflow-hidden sm:h-52 md:h-64">
        {business.bannerUrl ? (
          <Image src={business.bannerUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-sky-400 to-cyan-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Share button */}
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="flex h-9 items-center gap-1.5 rounded-full bg-emerald-500 px-3 text-xs font-bold text-white shadow-md transition hover:bg-emerald-600"
          >
            <MessageCircle size={14} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={handleShare}
            className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold shadow-md transition ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-white/90 text-slate-700 hover:bg-white"
            }`}
          >
            {copied ? <CheckCircle size={14} /> : <Share2 size={14} />}
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </div>

      {/* Header info */}
      <div className="relative -mt-12 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-end gap-4">
            {/* Logo */}
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:h-28 sm:w-28">
              {business.logoUrl ? (
                <Image src={business.logoUrl} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-sky-100 text-2xl font-black text-sky-700">
                  {business.businessName?.charAt(0) || "S"}
                </div>
              )}
            </div>

            <div className="mb-2 flex-1">
              <h1 className="text-lg font-black text-white drop-shadow sm:text-2xl">
                {business.businessName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-white shadow">
                  <Star size={10} className="fill-white" /> {trustRating.toFixed(1)} Top Seller
                </span>
                {business.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                    <BadgeCheck size={10} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {/* About & Contact */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-sm font-black text-slate-900">About</h2>

              {business.productTypes?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Deals In</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {business.productTypes.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 grid gap-2 text-sm">
                {(business.location?.city || business.location?.country) && (
                  <span className="flex items-center gap-2 text-slate-600">
                    <MapPin size={14} className="text-sky-500" />
                    {[business.location.city, business.location.state, business.location.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-2 text-slate-600 transition hover:text-sky-700"
                  >
                    <Phone size={14} className="text-sky-500" />
                    {business.phone}
                  </a>
                )}
              </div>

              {/* Social links */}
              {Object.values(business.socialLinks || {}).some(Boolean) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {business.socialLinks.instagram && (
                    <a
                      href={business.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 items-center gap-1 rounded-lg bg-pink-50 px-2.5 text-xs font-bold text-pink-600 transition hover:bg-pink-100"
                    >
                      <Instagram size={14} /> Instagram
                    </a>
                  )}
                  {business.socialLinks.facebook && (
                    <a
                      href={business.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 items-center gap-1 rounded-lg bg-blue-50 px-2.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100"
                    >
                      <Facebook size={14} /> Facebook
                    </a>
                  )}
                  {business.socialLinks.linkedin && (
                    <a
                      href={business.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 items-center gap-1 rounded-lg bg-blue-50 px-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                  {business.socialLinks.website && (
                    <a
                      href={business.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 items-center gap-1 rounded-lg bg-slate-100 px-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                    >
                      <Globe size={14} /> Website
                    </a>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="tk-btn-primary flex-1 text-center text-xs"
                  >
                    <Phone size={14} className="mr-1 inline" /> Contact Seller
                  </a>
                )}
                {business.phone && (
                  <a
                    href={`https://wa.me/${business.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Store Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                  activeTab === "all"
                    ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md"
                    : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                }`}
              >
                All Products
              </button>
              {bestSellers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("best")}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    activeTab === "best"
                      ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md"
                      : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                  }`}
                >
                  <Star size={12} className="mr-1 inline" /> Best Sellers
                </button>
              )}
              {categories.map(([cid, cname]) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => setActiveTab(cid)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    activeTab === cid
                      ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md"
                      : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                  }`}
                >
                  {cname}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products in this store..."
                className="tk-input w-full pl-10"
              />
            </div>

            {/* Best Sellers Carousel */}
            {activeTab === "all" && bestSellers.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-black text-slate-900">
                  <Star size={16} className="fill-amber-400 text-amber-400" /> Best Sellers
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {bestSellers.map((ad) => (
                    <StoreProductCard key={ad.id} ad={ad} />
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            <div>
              <h3 className="mb-3 text-sm font-black text-slate-900">
                {activeTab === "best" ? "Best Sellers" : "All Products"} ({filteredAds.length})
              </h3>
              {filteredAds.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                  <Package size={32} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-sm font-bold text-slate-500">No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredAds.map((ad) => (
                    <StoreProductCard key={ad.id} ad={ad} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Trust indicators */}
          <div className="hidden space-y-4 lg:block">
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900">Trust Indicators</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                    <Star size={18} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{trustRating.toFixed(1)} / 5.0</p>
                    <p className="text-xs text-slate-500">Seller Rating</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                    <Package size={18} className="text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{completedDeals}</p>
                    <p className="text-xs text-slate-500">Completed Orders</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                    <Shield size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {business.verified ? "Verified" : "Not Verified"}
                    </p>
                    <p className="text-xs text-slate-500">Seller Status</p>
                  </div>
                </div>
                {joinedYears && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                      <Eye size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{joinedYears}</p>
                      <p className="text-xs text-slate-500">Member Since</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreProductCard({ ad }) {
  const image = ad.mainImage || ad.images?.[0] || "/placeholder-ad.svg";
  return (
    <Link
      href={`/ad/${ad.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={ad.title || ""}
          fill
          className="object-cover transition group-hover:scale-105"
          unoptimized
        />
        {ad.bestSeller && (
          <span className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-white shadow">
            <Star size={10} className="fill-white" /> Best
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-xs font-bold text-slate-900">{ad.title}</p>
        <p className="mt-auto pt-2 text-sm font-black text-sky-700">{formatPrice(ad.price)}</p>
        <span className="mt-1 inline-flex items-center justify-center gap-1 rounded-lg bg-sky-50 py-1.5 text-[10px] font-bold text-sky-700 transition group-hover:bg-sky-100">
          View <ExternalLink size={10} />
        </span>
      </div>
    </Link>
  );
}
