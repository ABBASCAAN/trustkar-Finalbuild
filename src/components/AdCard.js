"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Star } from "lucide-react";
import { cn, formatPrice, formatTimeAgo, getConditionBadgeClass } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { toggleWishlist, isInWishlist } from "@/lib/firestore-helpers";
import { useToast } from "@/context/ToastContext";

export default function AdCard({ ad, showPrice = false, compact = false }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [favorited, setFavorited] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imageUrl = ad.mainImage || ad.images?.[0] || "/placeholder-ad.svg";

  useEffect(() => {
    if (!user) return;
    isInWishlist(user.uid, ad.id).then(setFavorited);
  }, [user, ad.id]);

  async function toggleFav(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast("Login to save favourites", "info");
      return;
    }
    try {
      const added = await toggleWishlist(user.uid, ad.id, ad);
      setFavorited(added);
      showToast(added ? "Added to favourites" : "Removed", "success");
    } catch {
      showToast("Could not update favourites", "error");
    }
  }

  return (
    <Link
      href={`/ad/${ad.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden border bg-white transition active:scale-[0.97]",
        compact
          ? "rounded-lg border-slate-100 shadow-sm"
          : "rounded-2xl border-slate-200 duration-300 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-100/50"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-slate-100",
          compact ? "aspect-square" : "aspect-[4/3]"
        )}
      >
        {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
        <Image
          src={imageUrl}
          alt={ad.title}
          fill
          className={cn(
            "object-cover transition duration-500 group-hover:scale-105",
            imgLoaded ? "opacity-100" : "opacity-0"
          )}
          sizes={compact ? "25vw" : "(max-width: 768px) 50vw, 220px"}
          unoptimized={imageUrl.startsWith("http")}
          onLoad={() => setImgLoaded(true)}
        />
        {!compact && (
          <button
            type="button"
            onClick={toggleFav}
            className={cn(
              "absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition",
              favorited ? "bg-red-500 text-white" : "bg-slate-900/60 text-white hover:bg-red-500"
            )}
            aria-label="Favourites"
          >
            <Heart size={13} className={favorited ? "fill-white" : ""} />
          </button>
        )}
        {ad.condition && (
          <span
            className={cn(
              "absolute left-1 top-1 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm",
              compact ? "left-1 top-1" : "left-2 top-2",
              getConditionBadgeClass(ad.condition)
            )}
          >
            {ad.condition}
          </span>
        )}
        {ad.featured && (
          <span
            className={cn(
              "absolute bottom-1 left-1 z-10 flex items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 font-bold text-white shadow",
              compact ? "h-5 w-5 text-[9px]" : "bottom-2 left-2 h-6 w-6 text-xs"
            )}
          >
            <Star size={compact ? 10 : 12} className="fill-white" />
          </span>
        )}
      </div>
      <div className={cn(compact ? "p-1.5" : "p-3")}>
        {showPrice && (
          <p
            className={cn(
              "font-black text-sky-700",
              compact ? "text-[10px] leading-none" : "text-sm"
            )}
          >
            {formatPrice(ad.price)}
          </p>
        )}
        <h3
          className={cn(
            "font-bold text-slate-900",
            compact
              ? "mt-0.5 line-clamp-2 text-[9px] leading-tight"
              : `line-clamp-2 text-sm ${showPrice ? "mt-0.5" : ""}`
          )}
        >
          {ad.title}
        </h3>
        {!compact && (
          <div className="mt-1.5 flex items-center justify-between">
            <p className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <MapPin size={11} className="shrink-0 text-cyan-600" />
              {ad.city || ad.location || "Pakistan"}
            </p>
            {ad.createdAt?.seconds && (
              <p className="text-[10px] font-medium text-slate-400">
                {formatTimeAgo(ad.createdAt.seconds)}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
