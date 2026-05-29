"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAdById,
  createTransaction,
  recordAdView,
  notifyContactSeller,
  getEscrowSettings,
  toggleWishlist,
  isInWishlist,
  fetchUserProfile,
  createOrGetChat,
} from "@/lib/firestore-helpers";
import EscrowTrustStrip from "@/components/EscrowTrustStrip";
import { calculateEscrowFees } from "@/lib/escrow-engine";
import { cn, formatPrice, getConditionBadgeClass, getMemberSinceYears } from "@/lib/utils";
import ImageLightbox from "@/components/ImageLightbox";
import {
  MapPin,
  Star,
  Loader2,
  ShoppingCart,
  MessageCircle,
  CheckCircle,
  ZoomIn,
  User,
  Sparkles,
  Share2,
  Heart,
  Shield,
  Pencil,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function AdDetailContent() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const posted = searchParams.get("posted");
  const pending = searchParams.get("pending");
  const { user, profile, isSuspended } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [error, setError] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [feePreview, setFeePreview] = useState(null);
  const [favorited, setFavorited] = useState(false);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchAdById(id, { viewerId: user?.uid }).then((data) => {
      setAd(data);
      setLoading(false);
      if (data && user) recordAdView(user.uid, data);
      if (data?.price) {
        getEscrowSettings().then((s) => {
          setFeePreview(calculateEscrowFees(data.price, s));
        });
      }
      if (user && data) isInWishlist(user.uid, data.id).then(setFavorited);
      if (data?.sellerId) {
        fetchUserProfile(data.sellerId).then(setSellerProfile).catch(() => setSellerProfile(null));
      }
    });
  }, [id, user]);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: ad?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied", "success");
      }
    } catch {
      /* cancelled */
    }
  }

  async function handleWishlist() {
    if (!user) {
      router.push(`/auth/login?redirect=/ad/${id}`);
      return;
    }
    try {
      const added = await toggleWishlist(user.uid, id, ad);
      setFavorited(added);
      showToast(added ? "Saved to favourites" : "Removed from favourites", "success");
    } catch {
      showToast("Could not update favourites", "error");
    }
  }

  async function handleBuy() {
    if (!user) {
      router.push(`/auth/login?redirect=/ad/${id}`);
      return;
    }
    if (isSuspended) {
      setError("Your account is suspended.");
      return;
    }
    if (ad.sellerId === user.uid) {
      setError("You cannot buy your own listing.");
      return;
    }
    if (!profile?.phoneVerified) {
      showToast("Please verify your phone number to buy safely with escrow", "info");
      return;
    }
    const { isFullKycComplete, requiresFullKyc } = await import("@/lib/escrow-engine");
    if (requiresFullKyc(ad.price) && !isFullKycComplete(profile)) {
      showToast("Complete identity verification (CNIC + selfie) for high-value deals", "info");
      router.push(`/auth/kyc?redirect=/ad/${id}`);
      return;
    }
    setBuying(true);
    setError("");
    try {
      const { id: txId } = await createTransaction({
        adId: id,
        buyerId: user.uid,
        sellerId: ad.sellerId,
        amount: ad.price,
        adTitle: ad.title,
        buyerName: profile?.displayName || user.displayName,
        sellerName: ad.sellerName,
        buyerPhoto: profile?.photoURL || "",
        sellerPhoto: ad.sellerPhoto || "",
      });
      router.push(`/deal/${txId}`);
    } catch (err) {
      setError(err.message || "Could not start escrow.");
    } finally {
      setBuying(false);
    }
  }

  async function handleContact() {
    if (!user) {
      router.push(`/auth/login?redirect=/ad/${id}`);
      return;
    }
    if (ad.sellerId === user.uid) {
      showToast("This is your ad", "info");
      return;
    }
    setChatLoading(true);
    try {
      const chat = await createOrGetChat({
        adId: ad.id,
        buyerId: user.uid,
        sellerId: ad.sellerId,
        adTitle: ad.title,
        adImage: ad.mainImage || ad.images?.[0] || "",
        adPrice: ad.price,
        buyerName: profile?.displayName || user.displayName || "",
        sellerName: ad.sellerName || "",
      });
      router.push(`/chat/${chat.id}`);
    } catch {
      showToast("Could not start chat", "error");
      setChatLoading(false);
    }
  }

  async function sendContactMessage() {
    setContacting(true);
    try {
      const inquiryId = await notifyContactSeller({
        adId: id,
        adTitle: ad.title,
        sellerId: ad.sellerId,
        buyerId: user.uid,
        buyerName: profile?.displayName || user.displayName,
        message: contactMsg,
        listingId: ad.listingId,
      });
      setContactOpen(false);
      setContactMsg("");
      router.push(`/inquiry/${inquiryId}`);
    } catch {
      showToast("Could not start chat", "error");
    } finally {
      setContacting(false);
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="tk-container py-20 text-center">
        <h1 className="text-2xl font-bold">Listing not found or sold</h1>
        <Link href="/" className="mt-4 inline-block text-cyan-600 hover:underline">
          Back to TrustKar
        </Link>
      </div>
    );
  }

  const images = ad.images?.length ? ad.images : [ad.mainImage || "/placeholder-ad.svg"];
  const specRows = buildSpecRows(ad);

  return (
    <div className="tk-container py-6 pb-24 lg:py-8">
      {posted && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
          <CheckCircle className="h-5 w-5 shrink-0" />
          {pending || ad.status === "pending_approval"
            ? "Submitted — TrustKar admin will approve your listing before it appears on the site."
            : "Your ad is live on TrustKar!"}
        </div>
      )}
      {ad.status === "pending_approval" && !posted && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This listing is awaiting admin approval — only you can see this page.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
        <div>
          <div
            className="relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl bg-white shadow-lg"
            onClick={() => setLightboxOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setLightboxOpen(true)}
          >
            <Image src={images[activeImage]} alt={ad.title} fill className="object-contain" unoptimized />
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
              <ZoomIn size={14} /> Zoom
            </span>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                  activeImage === i ? "border-cyan-500" : "border-transparent"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
          <div className="tk-card mt-4">
            <h2 className="text-lg font-extrabold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{ad.description}</p>
          </div>
          <div className="mt-4 hidden lg:block">
            <EscrowTrustStrip />
          </div>
        </div>

        <div className="tk-card lg:sticky lg:top-20 lg:self-start">
          {ad.featured && (
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              <Sparkles size={12} /> Featured listing
            </span>
          )}
          {ad.listingId && (
            <p className="font-mono text-[11px] text-sky-700">ID: {ad.listingId}</p>
          )}
          <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{ad.title}</h1>
          <p className="mt-2 text-2xl font-black text-sky-700">{formatPrice(ad.price)}</p>
          {feePreview && (
            <p className="mt-1 text-xs text-slate-500">
              Escrow fee ~{formatPrice(feePreview.escrowFee)} ({feePreview.feePercent}%) · Seller receives{" "}
              {formatPrice(feePreview.sellerPayout)}
            </p>
          )}
          {ad.negotiable && <p className="text-sm text-slate-500">Negotiable</p>}
          {user && !profile?.phoneVerified && (
            <p className="mt-2 text-xs font-bold text-amber-700">
              Verify your phone to buy safely with escrow
            </p>
          )}

          {ad.condition && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm", getConditionBadgeClass(ad.condition))}>
                {ad.condition}
              </span>
            </div>
          )}

          <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-cyan-600" /> {ad.city || ad.location}
          </p>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Posted By</p>
            <Link
              href={`/seller/${ad.sellerId}`}
              className="flex items-center gap-3 transition hover:opacity-80"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                <User size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{sellerProfile?.displayName || ad.sellerName || "Seller"}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {(sellerProfile?.trustRating != null || ad.sellerTrustRating != null) && (
                    <span className="flex items-center gap-0.5 font-bold text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(sellerProfile?.trustRating ?? ad.sellerTrustRating).toFixed(1)}
                      {sellerProfile?.reviewCount ? ` (${sellerProfile.reviewCount})` : ""}
                    </span>
                  )}
                  {(() => {
                    const years = getMemberSinceYears(sellerProfile?.createdAt?.seconds);
                    return years > 0 ? (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        TrustKar Member · {years} yr{years > 1 ? "s" : ""}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>
            </Link>
          </div>

          {specRows.length > 0 && (
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {specRows.map(({ label, value }) => (
                <span key={label} className="contents">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </span>
              ))}
            </dl>
          )}

          <div className="mt-4 lg:hidden">
            <EscrowTrustStrip compact />
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={handleShare} className="tk-btn-outline flex-1 !py-2 text-xs">
              <Share2 size={16} /> Share
            </button>
            <button type="button" onClick={handleWishlist} className="tk-btn-outline flex-1 !py-2 text-xs">
              <Heart size={16} className={favorited ? "fill-red-500 text-red-500" : ""} />
              {favorited ? "Saved" : "Save"}
            </button>
          </div>

          {user && profile?.phoneVerified && (
            <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-sky-800">
              <Shield size={14} /> Your account is verified for escrow purchases
            </p>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {user && ad.sellerId === user.uid && (
            <Link
              href={`/post-ad?edit=${ad.id}`}
              className="tk-btn-outline mt-4 flex w-full items-center justify-center gap-2 !py-3"
            >
              <Pencil size={18} /> Edit Ad
            </Link>
          )}

          <button type="button" onClick={handleBuy} disabled={buying} className="tk-btn-primary mt-5 w-full !py-3.5">
            {buying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
            Buy Safely With Escrow
          </button>
          <button
            type="button"
            onClick={handleContact}
            disabled={chatLoading}
            className="tk-btn-outline mt-2 w-full !py-3"
          >
            {chatLoading ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />}
            Chat with Seller
          </button>
        </div>
      </div>

      {contactOpen && (
        <div className="fixed inset-0 z-[250] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-bold">Message seller</h3>
            <p className="mt-1 text-sm text-slate-500">Short message — seller & admin can reply in chat.</p>
            <textarea
              className="tk-input mt-3 min-h-[100px]"
              placeholder="Hi, is this still available?"
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
              maxLength={500}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="tk-btn-outline flex-1" onClick={() => setContactOpen(false)}>
                Cancel
              </button>
              <button type="button" className="tk-btn-primary flex-1" onClick={sendContactMessage} disabled={contacting}>
                {contacting ? <Loader2 className="animate-spin" size={18} /> : "Send & open chat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          activeIndex={activeImage}
          onClose={() => setLightboxOpen(false)}
          onChangeIndex={setActiveImage}
          title={ad.title}
        />
      )}
    </div>
  );
}

function buildSpecRows(ad) {
  const rows = [];
  const seen = new Set();

  function add(label, value) {
    const v = String(value ?? "").trim();
    if (!v) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ label, value: v });
  }

  add("Brand", ad.brand);
  add("Model", ad.model);
  if (ad.year) add("Year", ad.year);

  const topByKey = {
    brand: ad.brand,
    model: ad.model,
    year: ad.year,
  };

  for (const [k, v] of Object.entries(ad.attributes || {})) {
    if (!v) continue;
    const norm = k.toLowerCase();
    const top = topByKey[norm];
    if (top && String(v).trim().toLowerCase() === String(top).trim().toLowerCase()) continue;
    const label = norm.charAt(0).toUpperCase() + norm.slice(1).replace(/([A-Z])/g, " $1");
    add(label, v);
  }

  return rows;
}
