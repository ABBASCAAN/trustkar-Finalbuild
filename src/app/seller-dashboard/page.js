"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import {
  fetchBusinessProfile,
  updateBusinessProfile,
  fetchStoreAds,
  fetchSellerCategories,
  createSellerCategory,
  deleteSellerCategory,
  toggleAdBestSeller,
  toggleAdActive,
  updateAdSellerCategory,
  countAdsThisMonth,
  upgradeBusinessToPro,
} from "@/lib/firestore-helpers";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { AD_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/context/ToastContext";
import {
  Loader2,
  ArrowLeft,
  Store,
  Package,
  Tag,
  Settings,
  Star,
  Eye,
  EyeOff,
  Pencil,
  Camera,
  ImagePlus,
  Trash2,
  Plus,
  CheckCircle,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Shield,
  MapPin,
  Phone,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
  Crown,
  Zap,
} from "lucide-react";

export default function SellerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState("overview");
  const [business, setBusiness] = useState(null);
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [adsThisMonth, setAdsThisMonth] = useState(0);
  const [proLoading, setProLoading] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [b, a, c] = await Promise.all([
        fetchBusinessProfile(user.uid),
        fetchStoreAds(user.uid),
        fetchSellerCategories(user.uid),
      ]);
      if (!b) {
        setLoading(false);
        router.replace("/account-type");
        return;
      }
      setBusiness(b);
      setAds(a);
      setCategories(c);
      setAdsThisMonth(countAdsThisMonth(a));
    } catch (err) {
      console.error("Seller dashboard load error:", err);
      // Silent fail on initial load — empty state is handled by UI
      // Only show toast if we already had data and refresh failed
      if (business) {
        showToast("Failed to refresh data. Please try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [user, router, showToast]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login?redirect=/seller-dashboard");
      return;
    }
    loadAll();
  }, [user, authLoading, router, loadAll]);

  async function handleCreateCategory() {
    if (!newCategory.trim() || !user) return;
    try {
      await createSellerCategory(user.uid, newCategory.trim());
      setNewCategory("");
      const c = await fetchSellerCategories(user.uid);
      setCategories(c);
      showToast("Category created", "success");
    } catch {
      showToast("Failed to create category", "error");
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteSellerCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("Category deleted", "success");
    } catch {
      showToast("Failed to delete", "error");
    }
  }

  async function handleToggleBestSeller(adId, current) {
    try {
      await toggleAdBestSeller(adId, !current);
      setAds((prev) =>
        prev.map((a) => (a.id === adId ? { ...a, bestSeller: !current } : a))
      );
      showToast(current ? "Removed from best sellers" : "Marked as best seller", "success");
    } catch {
      showToast("Failed to update", "error");
    }
  }

  async function handleToggleActive(adId, currentIsActive) {
    try {
      await toggleAdActive(adId, !currentIsActive);
      setAds((prev) =>
        prev.map((a) =>
          a.id === adId
            ? { ...a, status: currentIsActive ? AD_STATUS.INACTIVE : AD_STATUS.ACTIVE }
            : a
        )
      );
      showToast(currentIsActive ? "Product hidden" : "Product activated", "success");
    } catch {
      showToast("Failed to update", "error");
    }
  }

  async function handleAssignCategory(adId, categoryId) {
    try {
      await updateAdSellerCategory(adId, categoryId);
      setAds((prev) =>
        prev.map((a) => (a.id === adId ? { ...a, sellerCategoryId: categoryId || null } : a))
      );
      showToast("Category assigned", "success");
    } catch {
      showToast("Failed to assign", "error");
    }
  }

  const FREE_AD_LIMIT = 5;
  const PRO_AD_LIMIT = 25;
  const isPro = business?.isPro === true;
  const adLimit = isPro ? PRO_AD_LIMIT : FREE_AD_LIMIT;
  const adsRemaining = Math.max(0, adLimit - adsThisMonth);
  const canPostAd = adsRemaining > 0;

  async function handleUpgradePro() {
    if (!user) return;
    setProLoading(true);
    try {
      await upgradeBusinessToPro(user.uid, "monthly");
      showToast("PRO Shop activated! You can now post up to 25 ads/month.", "success");
      await loadAll();
    } catch (err) {
      console.error("PRO upgrade error:", err);
      showToast("Failed to activate PRO. Please try again.", "error");
    } finally {
      setProLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  const activeAds = ads.filter((a) => a.status === AD_STATUS.ACTIVE);
  const inactiveAds = ads.filter((a) => a.status === AD_STATUS.INACTIVE);
  const bestSellers = ads.filter((a) => a.bestSeller);

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50">
      {/* Fixed header */}
      <div className="shrink-0 border-b border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-700 text-[10px] font-black text-white shadow-sm">
              TK
            </span>
            <div>
              <h1 className="text-base font-black text-slate-900">Seller Dashboard</h1>
              <p className="text-[10px] font-medium text-slate-400">{business?.businessName}</p>
            </div>
          </div>
          <div className="ml-auto">
            {business?.slug && (
              <Link
                href={`/store/${business.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
              >
                <Store size={14} /> View Store
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 bg-slate-50/60 px-4 pb-2 pt-2 sm:px-6">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "products", label: "Products", icon: Package },
            { id: "categories", label: "Categories", icon: Tag },
            { id: "store", label: "Store Settings", icon: Settings },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                tab === t.id
                  ? "bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-white hover:shadow-sm"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 sm:px-6">
        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Store Preview Card */}
            {business && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Banner */}
                <div className="relative h-36 w-full sm:h-48">
                  <Image
                    src={business.bannerUrl || "/store-banner-placeholder.svg"}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Logo + Name overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3 sm:bottom-4 sm:left-4 sm:right-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-lg sm:h-20 sm:w-20">
                      <Image
                        src={business.logoUrl || "/store-logo-placeholder.svg"}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="mb-1 min-w-0 flex-1">
                      <h2 className="truncate text-lg font-black text-white sm:text-xl">
                        {business.businessName}
                      </h2>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          <Star size={10} className="fill-amber-400 text-amber-400" /> {business.trustRating || 5.0}
                        </span>
                        {business.verified && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                            <Shield size={10} /> Verified
                          </span>
                        )}
                        {isPro && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                            <Crown size={10} /> PRO
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          <Package size={10} /> {ads.length} Products
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Row */}
                <div className="px-4 py-3 sm:px-5 sm:py-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                    {business.location?.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} className="text-red-500" />
                        {business.location.city}
                        {business.location.state && `, ${business.location.state}`}
                      </span>
                    )}
                    {business.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={13} className="text-emerald-600" />
                        {business.phone}
                      </span>
                    )}
                  </div>

                  {/* Social links */}
                  {business.socialLinks && Object.values(business.socialLinks).some(Boolean) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {business.socialLinks.instagram && (
                        <a href={business.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm transition hover:scale-110">
                          <Instagram size={14} />
                        </a>
                      )}
                      {business.socialLinks.facebook && (
                        <a href={business.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:scale-110">
                          <Facebook size={14} />
                        </a>
                      )}
                      {business.socialLinks.linkedin && (
                        <a href={business.socialLinks.linkedin} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-white shadow-sm transition hover:scale-110">
                          <Linkedin size={14} />
                        </a>
                      )}
                      {business.socialLinks.website && (
                        <a href={business.socialLinks.website} target="_blank" rel="noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-white shadow-sm transition hover:scale-110">
                          <Globe size={14} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/store/${business.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                    >
                      <ExternalLink size={13} /> View Public Store
                    </Link>
                    <Link
                      href="/post-ad"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Plus size={13} /> Add Product
                    </Link>
                    <button
                      type="button"
                      onClick={() => setTab("store")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                    >
                      <Settings size={13} /> Edit Store
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Active Products", value: activeAds.length, icon: Package, color: "sky" },
                { label: "Best Sellers", value: bestSellers.length, icon: Star, color: "amber" },
                { label: "Inactive", value: inactiveAds.length, icon: EyeOff, color: "slate" },
                { label: "Total Products", value: ads.length, icon: TrendingUp, color: "emerald" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-${s.color}-50`}>
                    <s.icon size={18} className={`text-${s.color}-600`} />
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-900">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Ad Limit + Quick actions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black text-slate-900">Quick Actions</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase ${adsRemaining === 0 ? "text-red-500" : "text-slate-400"}`}>
                    {adsThisMonth}/{adLimit} ads this month
                  </span>
                  {!isPro && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                      Free Plan
                    </span>
                  )}
                  {isPro && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                      PRO Plan
                    </span>
                  )}
                </div>
              </div>

              {/* Ad usage bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    adsThisMonth >= adLimit ? "bg-red-500" : isPro ? "bg-amber-400" : "bg-sky-500"
                  }`}
                  style={{ width: `${Math.min(100, (adsThisMonth / adLimit) * 100)}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {canPostAd ? (
                  <Link href="/post-ad" className="tk-btn-primary text-center text-xs">
                    <Plus size={14} className="mr-1 inline" /> Add Product
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-200 px-6 py-2.5 text-xs font-bold text-slate-400"
                    title="Ad limit reached. Upgrade to PRO to post more."
                  >
                    <Plus size={14} /> Limit Reached
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTab("products")}
                  className="tk-btn-outline text-xs"
                >
                  <Package size={14} className="mr-1 inline" /> Manage Products
                </button>
                <button
                  type="button"
                  onClick={() => setTab("store")}
                  className="tk-btn-outline text-xs"
                >
                  <Settings size={14} className="mr-1 inline" /> Edit Store
                </button>
              </div>

              {/* Get PRO Shop banner */}
              {!isPro && (
                <div className="pro-glow-banner relative mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 p-4">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-300/20 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-6 -left-6 h-16 w-16 rounded-full bg-yellow-400/15 blur-2xl" />
                  <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="pro-icon-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-200/50">
                        <Crown size={20} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-900">Get PRO Shop</h4>
                        <p className="text-[10px] font-semibold text-amber-700/80">
                          25 ads/month · Best Seller badges · Priority support
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUpgradePro}
                      disabled={proLoading}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white shadow-lg shadow-amber-200/50 transition hover:from-amber-600 hover:to-yellow-600 disabled:opacity-60"
                    >
                      {proLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Zap size={14} />
                      )}
                      Activate PRO
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Recent products */}
            {ads.slice(0, 4).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-900">Recent Products</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ads.slice(0, 4).map((ad) => (
                    <div key={ad.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <div className="relative aspect-square">
                        <Image
                          src={ad.mainImage || ad.images?.[0] || "/placeholder-ad.svg"}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="p-2">
                        <p className="truncate text-xs font-bold text-slate-900">{ad.title}</p>
                        <p className="text-xs font-black text-sky-700">{formatPrice(ad.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">All Products</h3>
              <Link href="/post-ad" className="tk-btn-primary text-xs">
                <Plus size={14} className="mr-1 inline" /> Add New
              </Link>
            </div>

            {ads.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
                <Package size={32} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-bold text-slate-500">No products yet</p>
                <Link href="/post-ad" className="tk-btn-primary mt-3 inline-block text-xs">
                  Post your first product
                </Link>
              </div>
            )}

            {ads.map((ad) => {
              const isActive = ad.status === AD_STATUS.ACTIVE;
              const catName = categories.find((c) => c.id === ad.sellerCategoryId)?.name || "";
              return (
                <div
                  key={ad.id}
                  className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center ${
                    isActive ? "border-slate-200" : "border-slate-200 opacity-60"
                  }`}
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={ad.mainImage || ad.images?.[0] || "/placeholder-ad.svg"}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{ad.title}</p>
                    <p className="text-sm font-black text-sky-700">{formatPrice(ad.price)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle size={10} /> Active
                          </>
                        ) : (
                          <>
                            <EyeOff size={10} /> Hidden
                          </>
                        )}
                      </span>
                      {ad.bestSeller && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                          <Star size={10} className="fill-amber-400 text-amber-400" /> Best
                        </span>
                      )}
                      {catName && (
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-700">
                          {catName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category assign */}
                    <select
                      value={ad.sellerCategoryId || ""}
                      onChange={(e) => handleAssignCategory(ad.id, e.target.value || null)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-600 outline-none"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleToggleBestSeller(ad.id, ad.bestSeller)}
                      className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition ${
                        ad.bestSeller
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600 hover:bg-amber-50"
                      }`}
                    >
                      <Star size={13} className={ad.bestSeller ? "fill-amber-400" : ""} />
                      {ad.bestSeller ? "Best" : "Mark Best"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(ad.id, isActive)}
                      className={`flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition ${
                        isActive
                          ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                      {isActive ? "Hide" : "Show"}
                    </button>

                    <Link
                      href={`/post-ad?edit=${ad.id}`}
                      className="flex h-8 items-center gap-1 rounded-lg bg-sky-50 px-2.5 text-[11px] font-bold text-sky-700 transition hover:bg-sky-100"
                    >
                      <Pencil size={13} /> Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CATEGORIES */}
        {tab === "categories" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-black text-slate-900">Create Category</h3>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateCategory())}
                  placeholder="e.g. Summer Collection"
                  className="tk-input flex-1"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="tk-btn-primary !px-3"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-black text-slate-900">Your Categories</h3>
              {categories.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No categories yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <span className="text-sm font-bold text-slate-900">{c.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STORE SETTINGS */}
        {tab === "store" && business && (
          <StoreSettings business={business} userId={user?.uid} onUpdate={loadAll} />
        )}
      </div>
    </div>
  );
}

function StoreSettings({ business, userId, onUpdate }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    businessName: business.businessName || "",
    phone: business.phone || "",
    description: business.description || "",
    tagline: business.tagline || "",
    shippingPolicies: business.shippingPolicies || "",
    location: {
      city: business.location?.city || "",
      state: business.location?.state || "",
      country: business.location?.country || "Pakistan",
    },
    socialLinks: {
      instagram: business.socialLinks?.instagram || "",
      facebook: business.socialLinks?.facebook || "",
      linkedin: business.socialLinks?.linkedin || "",
      website: business.socialLinks?.website || "",
    },
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(business.logoUrl || "");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(business.bannerUrl || "");
  const [saving, setSaving] = useState(false);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      let logoUrl = business.logoUrl;
      let bannerUrl = business.bannerUrl;
      if (logoFile) {
        const res = await uploadImageToCloudinary(logoFile, { folder: "store_logos" });
        logoUrl = res.secureUrl || res.url;
      }
      if (bannerFile) {
        const res = await uploadImageToCloudinary(bannerFile, { folder: "store_banners" });
        bannerUrl = res.secureUrl || res.url;
      }
      await updateBusinessProfile(userId, {
        businessName: form.businessName,
        phone: form.phone,
        description: form.description,
        tagline: form.tagline,
        shippingPolicies: form.shippingPolicies,
        location: form.location,
        socialLinks: form.socialLinks,
        logoUrl,
        bannerUrl,
      });
      showToast("Store updated successfully", "success");
      onUpdate();
    } catch {
      showToast("Failed to update store", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-black text-slate-900">Store Details</h3>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Business Name
            </label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => updateField("businessName", e.target.value)}
              className="tk-input w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Business Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="tk-input w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="e.g. Quality Electronics, Trusted Deals"
              className="tk-input w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Seller Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Describe your store, services, and what customers can expect..."
              className="tk-input w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Shipping Policies
            </label>
            <textarea
              rows={3}
              value={form.shippingPolicies}
              onChange={(e) => updateField("shippingPolicies", e.target.value)}
              placeholder="e.g. Shipping policies, express manners, Escrow protection with 85 screen protection..."
              className="tk-input w-full"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">City</label>
              <input
                type="text"
                value={form.location.city}
                onChange={(e) =>
                  updateField("location", { ...form.location, city: e.target.value })
                }
                className="tk-input w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">State</label>
              <input
                type="text"
                value={form.location.state}
                onChange={(e) =>
                  updateField("location", { ...form.location, state: e.target.value })
                }
                className="tk-input w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Country</label>
              <input
                type="text"
                value={form.location.country}
                onChange={(e) =>
                  updateField("location", { ...form.location, country: e.target.value })
                }
                className="tk-input w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logo & Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-black text-slate-900">Store Images</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Logo</label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="store-logo"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setLogoFile(f);
                  setLogoPreview(URL.createObjectURL(f));
                }
              }}
            />
            <label
              htmlFor="store-logo"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300"
            >
              {logoPreview ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-xl">
                  <Image src={logoPreview} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <Camera size={24} className="text-slate-400" />
              )}
              <span className="text-xs font-bold text-slate-500">
                {logoPreview ? "Change Logo" : "Upload Logo"}
              </span>
            </label>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Banner</label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="store-banner"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setBannerFile(f);
                  setBannerPreview(URL.createObjectURL(f));
                }
              }}
            />
            <label
              htmlFor="store-banner"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300"
            >
              {bannerPreview ? (
                <div className="relative h-20 w-full overflow-hidden rounded-xl">
                  <Image src={bannerPreview} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <ImagePlus size={24} className="text-slate-400" />
              )}
              <span className="text-xs font-bold text-slate-500">
                {bannerPreview ? "Change Banner" : "Upload Banner"}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-black text-slate-900">Social Links</h3>
        <div className="mt-4 space-y-3">
          {[
            { key: "instagram", label: "Instagram", color: "pink" },
            { key: "facebook", label: "Facebook", color: "blue" },
            { key: "linkedin", label: "LinkedIn", color: "blue" },
            { key: "website", label: "Website", color: "slate" },
          ].map((s) => (
            <div key={s.key}>
              <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
                {s.label}
              </label>
              <input
                type="text"
                value={form.socialLinks[s.key]}
                onChange={(e) =>
                  updateField("socialLinks", { ...form.socialLinks, [s.key]: e.target.value })
                }
                placeholder={`https://${s.key}.com/yourname`}
                className="tk-input w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="tk-btn-primary w-full !py-3.5 text-sm font-bold"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
      </button>
    </div>
  );
}
