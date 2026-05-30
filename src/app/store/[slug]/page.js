"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  fetchBusinessBySlug,
  fetchStoreAds,
  fetchSellerReviews,
  fetchSellerCategories,
  toggleFollowStore,
  isFollowingStore,
  toggleWishlist,
  isInWishlist,
} from "@/lib/firestore-helpers";
import { formatPrice, formatTimeAgo } from "@/lib/utils";
import { AD_STATUS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
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
  Store,
  Search,
  Loader2,
  Package,
  Heart,
  ExternalLink,
  ChevronDown,
  Mail,
  User,
} from "lucide-react";

export default function StoreFrontPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [business, setBusiness] = useState(null);
  const [ads, setAds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [sellerCategories, setSellerCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [wishlistLoading, setWishlistLoading] = useState(new Set());

  const loadAll = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const b = await fetchBusinessBySlug(slug);
      if (!b) { setLoading(false); return; }
      setBusiness(b);
      const [a, r, cats] = await Promise.all([
        fetchStoreAds(b.id, { status: AD_STATUS.ACTIVE }),
        fetchSellerReviews(b.id),
        fetchSellerCategories(b.id),
      ]);
      setAds(a);
      setReviews(r);
      setSellerCategories(cats);
      if (user?.uid && user.uid !== b.id) {
        const f = await isFollowingStore(user.uid, b.id);
        setFollowing(f);
      }
      if (user?.uid && a.length > 0) {
        const wSet = new Set();
        await Promise.all(a.slice(0, 20).map(async (ad) => {
          const w = await isInWishlist(user.uid, ad.id);
          if (w) wSet.add(ad.id);
        }));
        setWishlistSet(wSet);
      }
    } catch (err) {
      console.error("Store load error:", err);
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filteredAds = useMemo(() => {
    let list = [...ads];
    if (activeTab !== "all" && activeTab !== "about" && activeTab !== "reviews") {
      list = list.filter((a) => a.sellerCategoryId === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.title?.toLowerCase().includes(q));
    }
    if (sortBy === "price-low") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price-high") list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else {
      list.sort((a, b) => {
        const aT = a.createdAt?.toMillis ? a.createdAt.toMillis() : a.createdAt || 0;
        const bT = b.createdAt?.toMillis ? b.createdAt.toMillis() : b.createdAt || 0;
        return bT - aT;
      });
    }
    return list;
  }, [ads, activeTab, search, sortBy]);

  const bestSellers = useMemo(() => ads.filter((a) => a.bestSeller).slice(0, 4), [ads]);

  async function handleFollow() {
    if (!user) { showToast("Login to follow this store", "error"); return; }
    if (!business) return;
    setFollowLoading(true);
    try {
      const result = await toggleFollowStore(user.uid, business.id);
      setFollowing(result);
      showToast(result ? "Store followed" : "Unfollowed store", "success");
      const b = await fetchBusinessBySlug(slug);
      if (b) setBusiness(b);
    } catch { showToast("Failed to update follow status", "error"); }
    finally { setFollowLoading(false); }
  }

  async function handleToggleWishlist(adId) {
    if (!user) { showToast("Login to save to wishlist", "error"); return; }
    setWishlistLoading((p) => new Set(p).add(adId));
    try {
      await toggleWishlist(user.uid, adId);
      setWishlistSet((p) => { const n = new Set(p); n.has(adId) ? n.delete(adId) : n.add(adId); return n; });
    } catch { showToast("Failed to update wishlist", "error"); }
    finally { setWishlistLoading((p) => { const n = new Set(p); n.delete(adId); return n; }); }
  }

  function getConditionBadge(condition) {
    switch (condition) {
      case "Brand New": return { text: "New", cls: "bg-emerald-500 text-white" };
      case "Used": return { text: "Used", cls: "bg-amber-500 text-white" };
      case "Broken/For Parts": return { text: "Parts", cls: "bg-red-500 text-white" };
      default: return { text: condition || "", cls: "bg-slate-500 text-white" };
    }
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
  const followersCount = business.followersCount || 0;
  const isOwner = user?.uid === business.id;
  const memberSinceYear = business.createdAt?.toDate
    ? business.createdAt.toDate().getFullYear()
    : business.createdAt?.seconds
      ? new Date(business.createdAt.seconds * 1000).getFullYear()
      : "";

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Store Header */}
      <div className="bg-white">
        <div className="tk-container py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: Logo + Info */}
            <div className="flex items-start gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 sm:h-24 sm:w-24">
                {business.logoUrl ? (
                  <Image src={business.logoUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-sky-700">
                    {business.businessName?.charAt(0) || "S"}
                  </div>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 sm:text-xl">{business.businessName}</h1>
                  {business.verified && <BadgeCheck size={18} className="text-emerald-500" />}
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    <Star size={10} className="fill-amber-400 text-amber-400" /> {trustRating.toFixed(1)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{business.tagline || "Trusted seller on TrustKar"}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-emerald-600">Seller rating</span>
                  <Shield size={10} className="text-emerald-500" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="font-bold">{completedDeals}+ <span className="font-normal text-slate-400">Sales</span></span>
                  <span className="font-bold">{ads.length}+ <span className="font-normal text-slate-400">Listings</span></span>
                  {memberSinceYear && <span className="font-bold">{memberSinceYear} <span className="font-normal text-slate-400">Member since</span></span>}
                  {(business.location?.city || business.location?.country) && (
                    <span className="font-bold">{[business.location.city, business.location.country].filter(Boolean).join(", ")}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Follow + Search */}
            <div className="flex flex-col gap-3 sm:items-end">
              {!isOwner && (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition ${
                    following
                      ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      : "bg-sky-600 text-white shadow-md hover:bg-sky-700"
                  }`}
                >
                  {followLoading ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />}
                  {following ? "Following" : "Follow Store"}
                </button>
              )}
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Store Store..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-slate-200 bg-white">
        <div className="tk-container">
          <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-hide">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition ${
                activeTab === "all" ? "border-sky-600 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >All Products</button>
            {sellerCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition ${
                  activeTab === cat.id ? "border-sky-600 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >{cat.name}</button>
            ))}
            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition ${
                activeTab === "about" ? "border-sky-600 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >About Store</button>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold transition ${
                activeTab === "reviews" ? "border-sky-600 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >Reviews</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="tk-container py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left Column */}
          <div className="space-y-5">
            {activeTab !== "about" && activeTab !== "reviews" && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-700">
                    {activeTab === "all" ? "All Products" : sellerCategories.find((c) => c.id === activeTab)?.name || "Products"}
                    <span className="ml-1 text-xs font-normal text-slate-400">({filteredAds.length})</span>
                  </p>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-slate-600 outline-none focus:border-sky-300"
                    >
                      <option value="newest">Newest</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {activeTab === "all" && bestSellers.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-black uppercase text-slate-400">Best Sellers</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {bestSellers.map((ad) => (
                        <StoreProductCard key={ad.id} ad={ad} onToggleWishlist={handleToggleWishlist} isWishlisted={wishlistSet.has(ad.id)} wishlistLoading={wishlistLoading.has(ad.id)} storeCity={business?.location?.city} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredAds.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                    <Package size={32} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-500">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {filteredAds.map((ad) => (
                      <StoreProductCard key={ad.id} ad={ad} onToggleWishlist={handleToggleWishlist} isWishlisted={wishlistSet.has(ad.id)} wishlistLoading={wishlistLoading.has(ad.id)} storeCity={business?.location?.city} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* About Store Tab */}
            {activeTab === "about" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-black text-slate-900">About {business.businessName}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {business.description || "No description available for this store."}
                </p>
                <div className="mt-4 grid gap-3 text-sm">
                  {business.phone && (
                    <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-sky-700">
                      <Phone size={14} className="text-sky-500" /> {business.phone}
                    </a>
                  )}
                  {(business.location?.city || business.location?.country) && (
                    <span className="flex items-center gap-2 text-slate-600">
                      <MapPin size={14} className="text-sky-500" />
                      {[business.location.city, business.location.state, business.location.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
                <h4 className="mt-5 text-xs font-black uppercase text-slate-400">Shipping Policies</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {business.shippingPolicies || "No shipping policies specified."}
                </p>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900">Customer Reviews ({reviews.length})</h3>
                {reviews.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                    <Star size={32} className="mx-auto text-slate-300" />
                    <p className="mt-2 text-sm font-bold text-slate-500">No reviews yet</p>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{rev.buyerName || "Anonymous"}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={10} className={i < (rev.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-[10px] text-slate-400">{formatTimeAgo(rev.createdAt?.seconds)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{rev.comment || rev.reviewText || ""}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - About Store */}
          <div className="hidden space-y-4 lg:block">
            <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black text-slate-900">About Store</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                {business.description || "No description available."}
              </p>

              <h4 className="mt-5 text-xs font-black uppercase text-slate-400">Contact Info</h4>
              <div className="mt-2 space-y-2 text-xs text-slate-600">
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-sky-500" />
                    <span>{business.phone}</span>
                  </div>
                )}
                {(business.location?.city || business.location?.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-sky-500" />
                    <span>{[business.location.city, business.location.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {business.socialLinks?.instagram && (
                  <a href={business.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-pink-600 hover:underline">
                    <Instagram size={13} /> Instagram
                  </a>
                )}
                {business.socialLinks?.facebook && (
                  <a href={business.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Facebook size={13} /> Facebook
                  </a>
                )}
                {business.socialLinks?.website && (
                  <a href={business.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-600 hover:underline">
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>

              <h4 className="mt-5 text-xs font-black uppercase text-slate-400">Shipping Policies</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {business.shippingPolicies || "No shipping policies specified."}
              </p>

              <h4 className="mt-5 text-xs font-black uppercase text-slate-400">Customer Reviews</h4>
              <div className="mt-2 space-y-3">
                {reviews.slice(0, 3).map((rev) => (
                  <div key={rev.id} className="border-b border-slate-100 pb-2 last:border-0">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} className={i < (rev.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">{rev.comment || rev.reviewText || ""}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{rev.buyerName || "Anonymous"}</p>
                  </div>
                ))}
                {reviews.length === 0 && <p className="text-xs text-slate-400">No reviews yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreProductCard({ ad, onToggleWishlist, isWishlisted, wishlistLoading, storeCity }) {
  const image = ad.mainImage || ad.images?.[0] || "/placeholder-ad.svg";
  const badge = ad.condition
    ? (ad.condition === "Brand New" ? { text: "New", cls: "bg-emerald-500" }
      : ad.condition === "Used" ? { text: "Used", cls: "bg-amber-500" }
      : ad.condition === "Broken/For Parts" ? { text: "Parts", cls: "bg-red-500" }
      : { text: ad.condition, cls: "bg-slate-500" })
    : null;
  const postedTime = formatTimeAgo(ad.createdAt?.seconds || ad.createdAt?.toMillis ? Math.floor(ad.createdAt.toMillis() / 1000) : 0);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-sky-300 hover:shadow-md">
      {/* Image */}
      <Link href={`/ad/${ad.id}`} className="relative aspect-square overflow-hidden bg-slate-100">
        <Image
          src={image}
          alt={ad.title || ""}
          fill
          className="object-cover transition group-hover:scale-105"
          unoptimized
        />
        {badge && (
          <span className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-black text-white ${badge.cls}`}>
            {badge.text}
          </span>
        )}
        {ad.bestSeller && (
          <span className="absolute left-2 top-6 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-white">
            Best
          </span>
        )}
      </Link>

      {/* Wishlist button */}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onToggleWishlist(ad.id); }}
        disabled={wishlistLoading}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm transition hover:text-red-500"
      >
        {wishlistLoading ? <Loader2 size={13} className="animate-spin" /> : <Heart size={14} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />}
      </button>

      {/* Content */}
      <Link href={`/ad/${ad.id}`} className="flex flex-1 flex-col p-3">
        <p className="text-sm font-black text-slate-900">{formatPrice(ad.price)}</p>
        <p className="mt-0.5 line-clamp-2 text-xs font-bold text-slate-700">{ad.title}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <MapPin size={10} /> {ad.location?.city || storeCity || "Pakistan"}
          </span>
          <span className="text-[10px] text-slate-400">{postedTime}</span>
        </div>
      </Link>
    </div>
  );
}
