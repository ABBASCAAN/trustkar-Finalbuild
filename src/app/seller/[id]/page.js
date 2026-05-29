"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  fetchUserProfile,
  fetchSellerReviews,
  fetchUserAds,
} from "@/lib/firestore-helpers";
import AdCard from "@/components/AdCard";
import { getMemberSinceYears } from "@/lib/utils";
import { Star, Shield, BadgeCheck, Calendar, Package, Loader2 } from "lucide-react";

export default function SellerProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [p, r, a] = await Promise.all([
        fetchUserProfile(id),
        fetchSellerReviews(id),
        fetchUserAds(id),
      ]);
      setProfile(p);
      setReviews(r);
      setAds(a.filter((x) => x.status === "active"));
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="tk-container py-20 text-center">
        <h1 className="text-xl font-bold">Seller not found</h1>
        <Link href="/" className="mt-4 text-cyan-600 hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  const avatar =
    profile.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || "S")}&background=00b4d8&color=fff&size=200`;

  return (
    <div className="tk-container py-10">
      <div className="tk-card flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-lg">
          <Image src={avatar} alt="" fill className="object-cover" unoptimized />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="flex flex-wrap items-center justify-center gap-2 text-2xl font-black sm:justify-start">
            {profile.displayName || "Seller"}
            {profile.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-800">
                <BadgeCheck size={14} /> Verified
              </span>
            )}
          </h1>
          <div className="mt-3 flex flex-wrap justify-center gap-4 text-sm text-slate-600 sm:justify-start">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {(profile.trustRating ?? 5).toFixed(1)} ({profile.reviewCount || reviews.length} reviews)
            </span>
            <span className="flex items-center gap-1">
              <Package size={14} /> {profile.completedDeals || 0} deals
            </span>
            <span className="flex items-center gap-1">
              <Shield size={14} />
              {(() => {
                const years = getMemberSinceYears(profile?.createdAt?.seconds);
                return years > 0 ? `TrustKar Member · ${years} yr${years > 1 ? "s" : ""}` : "TrustKar Member";
              })()}
            </span>
          </div>
          {profile.bio && <p className="mt-4 text-sm text-slate-600">{profile.bio}</p>}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="tk-section-title mb-4">Active listings ({ads.length})</h2>
        {ads.length === 0 ? (
          <p className="text-slate-500">No active ads right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="tk-section-title mb-4">Buyer reviews</h2>
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
            No reviews yet — reviews appear after successful escrow trades.
          </p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="tk-card !p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{r.buyerName || "Buyer"}</span>
                  <span className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: r.rating || 5 }).map((_, i) => (
                      <Star key={i} size={14} className="fill-current" />
                    ))}
                  </span>
                </div>
                {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={12} /> Successful trade review
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
