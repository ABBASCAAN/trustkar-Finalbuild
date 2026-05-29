"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserTransactions,
  fetchUserAds,
  fetchWishlist,
  fetchViewHistory,
  createReview,
  updateTransactionStatus,
  subscribeNotifications,
  markNotificationRead,
  updateAd,
  deleteAd,
  createNotification,
  toggleWishlist,
  fetchUserChats,
  deleteChat,
} from "@/lib/firestore-helpers";
import { COLLECTIONS, ESCROW_STATUS, ESCROW_STATUS_LABELS, AD_STATUS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Loader2,
  Package,
  Heart,
  Eye,
  ShoppingBag,
  Star,
  Bell,
  History,
  Pencil,
  Trash2,
  Power,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import AdsGrid from "@/components/ads/AdsGrid";
import { playNotificationSound } from "@/lib/sound";

const TABS = [
  { id: "listings", label: "My Ads", icon: Package },
  { id: "purchases", label: "Purchases", icon: ShoppingBag },
  { id: "sales", label: "Sales", icon: ShoppingBag },
  { id: "wishlist", label: "Favourites", icon: Heart },
  { id: "chats", label: "Chats", icon: MessageCircle },
  { id: "views", label: "Recently Viewed", icon: Eye },
  { id: "history", label: "Buy History", icon: History },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function DashboardInner() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "listings";
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [myAds, setMyAds] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTx, setReviewTx] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [chats, setChats] = useState([]);

  const soundInitRef = useRef(false);
  const prevUnreadCountRef = useRef(0);
  const lastSoundedNotifIdRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login?redirect=/dashboard");
      return;
    }
    loadAll();
    const unsub = subscribeNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user, authLoading]);

  // Live “new notification” sound (skip initial load; only play when unread count increases).
  useEffect(() => {
    if (!user) return;

    const unreadCount = notifications.reduce((s, n) => s + (!n.read ? 1 : 0), 0);
    if (!soundInitRef.current) {
      soundInitRef.current = true;
      prevUnreadCountRef.current = unreadCount;
      lastSoundedNotifIdRef.current = notifications.find((n) => !n.read)?.id ?? null;
      return;
    }

    if (unreadCount > prevUnreadCountRef.current) {
      const newestUnread = notifications.find((n) => !n.read);
      if (newestUnread && newestUnread.id !== lastSoundedNotifIdRef.current) {
        lastSoundedNotifIdRef.current = newestUnread.id;
        playNotificationSound();
        showToast(newestUnread.title || "New notification", "info");
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [notifications, user, showToast]);

  async function loadAll() {
    setLoading(true);
    try {
      const [tx, ads, wish, hist, chatList] = await Promise.all([
        fetchUserTransactions(user.uid),
        fetchUserAds(user.uid),
        fetchWishlist(user.uid),
        fetchViewHistory(user.uid),
        fetchUserChats(user.uid),
      ]);
      setTransactions(tx);
      setMyAds(ads);
      setWishlist(wish);
      setChats(chatList);

      const viewAds = await Promise.all(
        hist.map(async (v) => {
          const snap = await getDoc(doc(db, COLLECTIONS.ADS, v.adId));
          if (snap.exists() && snap.data().status === "active") {
            return { id: snap.id, ...snap.data() };
          }
          return null;
        })
      );
      setViews(viewAds.filter(Boolean));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!reviewTx) return;
    try {
      await createReview({
        buyerId: user.uid,
        sellerId: reviewTx.sellerId,
        transactionId: reviewTx.id,
        adId: reviewTx.adId,
        rating: reviewRating,
        comment: reviewComment,
        buyerName: profile?.displayName || user.displayName,
      });
      await updateTransactionStatus(reviewTx.id, reviewTx.status, { reviewed: true });
      showToast("Review submitted — thank you!", "success");
      setReviewTx(null);
      await loadAll();
    } catch {
      showToast("Could not submit review", "error");
    }
  }

  function setTab(id) {
    router.push(`/dashboard?tab=${id}`);
  }

  if (authLoading || !user) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  const purchases = transactions.filter((t) => t.buyerId === user.uid);
  const sales = transactions.filter((t) => t.sellerId === user.uid);

  return (
    <div className="tk-container py-8">
      {/* Cover / Profile header */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-700 p-6 text-white shadow-lg">
        <div className="relative z-10 flex items-center gap-4">
          {profile?.photoURL ? (
            <Image
              src={profile.photoURL}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-full border-2 border-white/40 object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-black backdrop-blur-sm">
              {(profile?.displayName || user?.email || "U").charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-xl font-black sm:text-2xl">{profile?.displayName || "My Dashboard"}</h1>
            <p className="text-sm text-sky-100">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Desktop: pill tabs */}
      <div className="hidden gap-2 overflow-x-auto pb-2 scrollbar-hide md:flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === id ? "bg-cyan-600 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Mobile: grid tiles */}
      <div className="grid grid-cols-4 gap-2 md:hidden">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition active:scale-95 ${
              tab === id ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            <Icon size={18} />
            <span className="text-[9px] font-bold leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : (
        <div className="mt-8">
          {tab === "listings" && (
            <>
              <div className="mb-4 flex justify-between">
                <h2 className="tk-section-title">My posted ads ({myAds.length})</h2>
                <Link href="/post-ad" className="tk-btn-primary !py-2 text-sm">
                  + New ad
                </Link>
              </div>
              {myAds.length === 0 ? (
                <p className="text-slate-500">No ads yet.</p>
              ) : (
                <ul className="space-y-3">
                  {myAds.map((ad) => (
                    <li key={ad.id} className="tk-card flex flex-wrap items-center justify-between gap-3 !p-3">
                      <Link href={`/ad/${ad.id}`} className="flex items-center gap-3 transition hover:opacity-80">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                          <Image src={ad.mainImage || ad.images?.[0] || "/placeholder-ad.svg"} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{ad.title}</p>
                          <p className="text-xs text-slate-500">{ad.status} {ad.disabled ? "· Disabled" : ""} {ad.status === AD_STATUS.INACTIVE ? "· Expired" : ""} · {formatPrice(ad.price)}</p>
                        </div>
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        {ad.status === AD_STATUS.INACTIVE && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateAd(ad.id, { status: AD_STATUS.PENDING_APPROVAL });
                                await createNotification({
                                  userId: user.uid,
                                  type: "ad_reactivated",
                                  title: "Ad re-activated",
                                  body: `"${ad.title}" has been sent for re-approval.`,
                                  link: `/ad/${ad.id}`,
                                });
                                showToast("Ad sent for re-approval", "success");
                                loadAll();
                              } catch { showToast("Failed", "error"); }
                            }}
                            className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"
                          >
                            <CheckCircle size={12} className="inline" /> Re-activate
                          </button>
                        )}
                        <Link
                          href={`/post-ad?edit=${ad.id}`}
                          className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700"
                        >
                          <Pencil size={12} className="inline" /> Edit
                        </Link>
                        {ad.status !== AD_STATUS.INACTIVE && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await updateAd(ad.id, { disabled: !ad.disabled });
                                showToast(ad.disabled ? "Ad enabled" : "Ad disabled", "success");
                                loadAll();
                              } catch { showToast("Failed", "error"); }
                            }}
                            className={`rounded-lg px-2 py-1 text-xs font-bold ${ad.disabled ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
                          >
                            <Power size={12} className="inline" /> {ad.disabled ? "Enable" : "Disable"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Delete this ad permanently?")) return;
                            try { await deleteAd(ad.id); showToast("Ad deleted", "success"); loadAll(); } catch { showToast("Failed", "error"); }
                          }}
                          className="rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-700"
                        >
                          <Trash2 size={12} className="inline" /> Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === "wishlist" && (
            <>
              <h2 className="tk-section-title mb-4">Favourites ({wishlist.length})</h2>
              {wishlist.length === 0 ? (
                <p className="text-slate-500">Save ads with the heart icon.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {wishlist.map((w) => {
                    const adId = w.id || w.adId;
                    return (
                      <div key={adId} className="tk-card block !p-3 hover:border-cyan-300">
                        <div className="relative mb-2 aspect-video overflow-hidden rounded-xl">
                          <Link href={`/ad/${adId}`} className="block">
                            {w.mainImage && (
                              <Image src={w.mainImage} alt="" fill className="object-cover" unoptimized />
                            )}
                          </Link>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!user?.uid || !adId) {
                                showToast("Could not remove", "error");
                                return;
                              }
                              try {
                                await toggleWishlist(user.uid, adId, w);
                                setWishlist((prev) => prev.filter((x) => (x.id || x.adId) !== adId));
                                showToast("Removed from favourites", "success");
                              } catch (err) {
                                console.error("Unfavourite error:", err);
                                showToast("Could not remove", "error");
                              }
                            }}
                            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:scale-110 pointer-events-auto"
                            aria-label="Remove from favourites"
                          >
                            <Heart size={14} className="fill-white" />
                          </button>
                        </div>
                        <Link href={`/ad/${adId}`} className="block">
                          <p className="line-clamp-2 text-sm font-bold">{w.title}</p>
                          <p className="text-cyan-700 font-black">{formatPrice(w.price)}</p>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {tab === "views" && (
            <>
              <h2 className="tk-section-title mb-4">Recently viewed</h2>
              {views.length === 0 ? (
                <p className="text-slate-500">Browse ads to see history here.</p>
              ) : (
                <AdsGrid ads={views} showPrice={false} />
              )}
            </>
          )}

          {(tab === "purchases" || tab === "sales") && (
            <TxList
              items={tab === "purchases" ? purchases : sales}
              role={tab === "purchases" ? "buyer" : "seller"}
              onReview={(tx) => setReviewTx(tx)}
            />
          )}

          {tab === "history" && (
            <>
              <h2 className="tk-section-title mb-4">Completed purchases</h2>
              <TxList
                items={purchases.filter((t) => t.status === ESCROW_STATUS.RELEASED)}
                role="buyer"
                onReview={(tx) => setReviewTx(tx)}
              />
            </>
          )}

          {tab === "chats" && <ChatsTab chats={chats} userId={user.uid} onUpdate={setChats} />}

          {tab === "notifications" && (
            <>
              <h2 className="tk-section-title mb-4">Notifications</h2>
              {notifications.length === 0 ? (
                <p className="text-slate-500">No notifications yet.</p>
              ) : (
                <ul className="space-y-2">
                  {notifications.map((n) => {
                    const urgency = n.urgency || (n.type?.includes("dispute") ? "urgent" : n.type?.includes("payment") ? "success" : "info");
                    const colors = {
                      urgent: "border-red-200 bg-red-50",
                      success: "border-emerald-200 bg-emerald-50",
                      warning: "border-amber-200 bg-amber-50",
                      info: "border-sky-200 bg-white",
                    };
                    const Icon = urgency === "urgent" ? AlertTriangle : urgency === "success" ? CheckCircle : Info;
                    return (
                      <li
                        key={n.id}
                        className={`tk-card !p-4 transition-all duration-300 animate-fade-in-up ${n.read ? "opacity-70" : colors[urgency] || colors.info}`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon size={16} className={`mt-0.5 shrink-0 ${urgency === "urgent" ? "text-red-600" : urgency === "success" ? "text-emerald-600" : "text-sky-600"}`} />
                          <div>
                            <p className="font-bold text-sm">{n.title}</p>
                            <p className="text-sm text-slate-600">{n.body}</p>
                            {n.link && (
                              <Link
                                href={n.link}
                                onClick={() => markNotificationRead(n.id)}
                                className="mt-2 inline-block text-xs font-bold text-sky-700 hover:underline"
                              >
                                Open →
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {reviewTx && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="tk-card w-full max-w-md">
            <h3 className="text-lg font-black">Rate seller</h3>
            <p className="mt-1 text-sm text-slate-600">{reviewTx.adTitle}</p>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setReviewRating(n)} className="p-1">
                  <Star size={28} className={n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                </button>
              ))}
            </div>
            <textarea
              className="tk-input mt-4"
              rows={3}
              placeholder="Share your experience (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" className="tk-btn-primary flex-1" onClick={submitReview}>
                Submit review
              </button>
              <button type="button" className="tk-btn-outline" onClick={() => setReviewTx(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TxList({ items, role, onReview }) {
  if (items.length === 0) {
    return <p className="text-slate-500">No transactions yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((tx) => (
        <li key={tx.id} className="tk-card flex flex-wrap items-center justify-between gap-3 !p-4">
          <div>
            <p className="font-bold">{tx.adTitle || "Deal"}</p>
            <p className="text-sm text-slate-500">
              {role === "buyer" ? "You bought" : "You sold"} · {ESCROW_STATUS_LABELS[tx.status] || tx.status}
              {tx.escrowId && <span className="block font-mono text-xs text-slate-400">{tx.escrowId}</span>}
            </p>
            <p className="font-black text-cyan-700">{formatPrice(tx.amount)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/deal/${tx.id}`} className="tk-btn-primary !py-2 text-xs">
              Open deal
            </Link>
            {role === "buyer" && tx.status === ESCROW_STATUS.RELEASED && !tx.reviewed && (
              <button type="button" className="tk-btn-outline !py-2 text-xs" onClick={() => onReview(tx)}>
                <Star size={14} /> Leave review
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChatsTab({ chats, userId, onUpdate }) {
  const [subTab, setSubTab] = useState("all");
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    switch (subTab) {
      case "buying":
        // Buying: other user initiated chat on MY listing → I am the seller
        return chats.filter((c) => c.sellerId === userId);
      case "selling":
        // Selling: I initiated chat on someone else's listing → I am the buyer
        return chats.filter((c) => c.buyerId === userId);
      default:
        return chats;
    }
  }, [chats, subTab, userId]);

  const tabs = [
    { id: "all", label: "All Chats", count: chats.length },
    { id: "buying", label: "Buying", count: chats.filter((c) => c.sellerId === userId).length },
    { id: "selling", label: "Selling", count: chats.filter((c) => c.buyerId === userId).length },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition sm:text-sm ${
              subTab === t.id
                ? "bg-cyan-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-slate-500">
          {subTab === "all"
            ? "No chats yet. Start a chat from a listing page."
            : subTab === "buying"
            ? "No one has started a chat on your listings yet."
            : "You haven't started any chats yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isBuyer = c.buyerId === userId;
            const otherName = isBuyer ? c.sellerName : c.buyerName;
            return (
              <div key={c.id} className="tk-card flex items-center gap-3 !p-3">
                {c.adImage && (
                  <Link href={`/ad/${c.adId}`} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <Image src={c.adImage} alt="" fill className="object-cover" unoptimized />
                  </Link>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/chat/${c.id}`} className="block transition hover:opacity-80">
                    <p className="truncate text-sm font-bold">{c.adTitle || "Chat"}</p>
                    <p className="text-xs text-slate-500">
                      {isBuyer ? "To:" : "From:"} {otherName || "User"}
                      {c.agreedPrice ? ` · Agreed ${formatPrice(c.agreedPrice)}` : ""}
                    </p>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/chat/${c.id}`}
                    className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteChat(c.id);
                        onUpdate((prev) => prev.filter((x) => x.id !== c.id));
                        showToast("Chat deleted", "success");
                      } catch {
                        showToast("Could not delete", "error");
                      }
                    }}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin" />}>
      <DashboardInner />
    </Suspense>
  );
}
