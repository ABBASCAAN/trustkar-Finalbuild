"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAllAds,
  fetchAllUsers,
  fetchAllTransactions,
  logAdminAction,
  fetchPendingVerifications,
  fetchPendingShipmentVerifications,
  fetchPendingReleases,
  fetchPendingAds,
  adminVerifyPayment,
  adminVerifyShipment,
  adminReleaseToSeller,
  adminResolveDispute,
  adminRefundBuyer,
  fetchOpenDisputes,
  fetchPendingReturnReviews,
  fetchReturnsInTransit,
  fetchRejectedAwaitingReturn,
  approveAd,
  rejectAd,
  getPaymentSettings,
  savePaymentSettings,
  fetchTransactionByEscrowId,
  searchUserByEmailOrPhone,
  fetchAllSponsoredBanners,
  createSponsoredBanner,
  updateSponsoredBanner,
  deleteSponsoredBanner,
  fetchAdByListingId,
  getHomepageSettings,
  saveHomepageSettings,
} from "@/lib/firestore-helpers";
import { ESCROW_STATUS, BANNER_SLOTS, DISPUTE_OUTCOMES } from "@/lib/constants";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { formatPrice } from "@/lib/utils";
import {
  Shield,
  Loader2,
  Ban,
  CheckCircle,
  Trash2,
  Users,
  CreditCard,
  Package,
  Sparkles,
  Search,
  Settings,
  ClipboardCheck,
  Megaphone,
  ExternalLink,
  Truck,
  RotateCcw,
  Banknote,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import AdminAnalytics from "./AdminAnalytics";
import AdminAdsManager from "./AdminAdsManager";
import AdminUserManager from "./AdminUserManager";

const TABS = [
  { id: "overview", label: "Overview", icon: Shield },
  { id: "verify", label: "Pending verification", icon: ClipboardCheck },
  { id: "shipment", label: "Verify shipments", icon: Truck },
  { id: "release", label: "Release payments", icon: CreditCard },
  { id: "returns", label: "Returns", icon: RotateCcw },
  { id: "refunds", label: "Refunds", icon: Banknote },
  { id: "disputes", label: "Disputes", icon: Shield },
  { id: "approvals", label: "Ad approvals", icon: ClipboardCheck },
  { id: "sponsored", label: "Paid ads", icon: Megaphone },
  { id: "transactions", label: "Deals", icon: CreditCard },
  { id: "ads", label: "Ads", icon: Package },
  { id: "users", label: "Users", icon: Users },
  { id: "payments", label: "Bank details", icon: Settings },
];

function DisputeResolveCard({ dispute, onResolved, adminId, resolve, showToast }) {
  const [outcome, setOutcome] = useState(DISPUTE_OUTCOMES.FULL_REFUND);
  const [partialAmount, setPartialAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await resolve(dispute.id, adminId, {
        outcome,
        partialAmount: outcome === DISPUTE_OUTCOMES.PARTIAL_REFUND ? partialAmount : null,
        note,
      });
      showToast("Dispute resolved", "success");
      onResolved();
    } catch (e) {
      showToast(e.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const allEvidence = [
    ...(dispute.evidenceUrls || []),
    ...(dispute.rejectionEvidenceUrls || []),
  ];

  return (
    <div className="tk-card space-y-3 !p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{dispute.reason}</p>
        <Link
          href={`/deal/${dispute.transactionId}`}
          className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 hover:bg-sky-200"
        >
          Open deal chat
        </Link>
      </div>
      <p className="text-sm text-slate-600 line-clamp-2">{dispute.description}</p>
      {dispute.rejectionReason && (
        <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          <span className="font-bold">Buyer rejection reason:</span> {dispute.rejectionReason}
        </div>
      )}

      {/* Evidence viewer */}
      {allEvidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase text-slate-500">Evidence ({allEvidence.length})</p>
          <div className="grid grid-cols-4 gap-2">
            {allEvidence.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
              >
                <Image src={url} alt={`Evidence ${i + 1}`} fill className="object-cover" unoptimized />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-bold uppercase text-slate-500">TrustKar Team Resolution</p>
        <select
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          className="tk-input w-full !py-2 text-sm"
        >
          <option value={DISPUTE_OUTCOMES.FULL_REFUND}>Full refund to buyer</option>
          <option value={DISPUTE_OUTCOMES.PARTIAL_REFUND}>Partial refund</option>
          <option value={DISPUTE_OUTCOMES.RELEASE_SELLER}>Release to seller</option>
        </select>
        {outcome === DISPUTE_OUTCOMES.PARTIAL_REFUND && (
          <input
            type="number"
            placeholder="Refund amount PKR"
            value={partialAmount}
            onChange={(e) => setPartialAmount(e.target.value)}
            className="tk-input w-full !py-2 text-sm"
          />
        )}
        <input
          placeholder="Resolution note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="tk-input w-full !py-2 text-sm"
        />
        <button type="button" disabled={busy} onClick={submit} className="tk-btn-primary w-full !bg-sky-700">
          {busy ? "Saving…" : "Resolve dispute"}
        </button>
      </div>
    </div>
  );
}

function LockedSection({ search, setSearch, onSearch, placeholder, children, unlocked }) {
  if (!unlocked) {
    return (
      <div className="tk-card mt-6 max-w-lg !p-8 text-center">
        <Search className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm text-slate-600">Enter email, mobile, or escrow ID to unlock this section</p>
        <div className="mt-4 flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="tk-input flex-1"
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button type="button" onClick={onSearch} className="tk-btn-primary shrink-0">
            Unlock
          </button>
        </div>
      </div>
    );
  }
  return children;
}

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [tab, setTab] = useState("overview");
  const [ads, setAds] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [pendingVerify, setPendingVerify] = useState([]);
  const [pendingShipmentVerify, setPendingShipmentVerify] = useState([]);
  const [pendingRelease, setPendingRelease] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [openDisputes, setOpenDisputes] = useState([]);
  const [pendingReturnReviews, setPendingReturnReviews] = useState([]);
  const [returnsInTransit, setReturnsInTransit] = useState([]);
  const [rejectedAwaitingReturn, setRejectedAwaitingReturn] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState("");
  const [txUnlocked, setTxUnlocked] = useState(false);
  const [paymentForm, setPaymentForm] = useState(null);
  const [escrowLookup, setEscrowLookup] = useState("");
  const [listingLookup, setListingLookup] = useState("");
  const [banners, setBanners] = useState([]);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    linkUrl: "",
    imageUrl: "",
    slot: "hero",
    order: 0,
    feePaid: "",
    active: true,
  });
  const [homepageSettings, setHomepageSettings] = useState({
    showPaidBanners: false,
    showGoogleAds: false,
    googleAdsClientId: "",
    googleAdSlotHero: "",
    googleAdSlotMid: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login?redirect=/admin");
      return;
    }
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadAll();
  }, [user, isAdmin, authLoading]);

  async function loadAll() {
    setLoading(true);
    try {
      const [a, t, u, pv, psv, pr, pa, pset, bn, od, hp, prr, rit, rar] = await Promise.all([
        fetchAllAds(),
        fetchAllTransactions(),
        fetchAllUsers(),
        fetchPendingVerifications(),
        fetchPendingShipmentVerifications(),
        fetchPendingReleases(),
        fetchPendingAds(),
        getPaymentSettings(),
        fetchAllSponsoredBanners(),
        fetchOpenDisputes().catch(() => []),
        getHomepageSettings(),
        fetchPendingReturnReviews().catch(() => []),
        fetchReturnsInTransit().catch(() => []),
        fetchRejectedAwaitingReturn().catch(() => []),
      ]);
      setAds(a);
      setTransactions(t);
      setUsers(u);
      setPendingVerify(pv);
      setPendingShipmentVerify(psv);
      setPendingRelease(pr);
      setPendingApprovals(pa);
      setOpenDisputes(od);
      setPendingReturnReviews(prr);
      setReturnsInTransit(rit);
      setRejectedAwaitingReturn(rar);
      setHomepageSettings(hp);
      setPaymentForm(pset);
      setBanners(bn);
    } catch (e) {
      console.error(e);
      showToast("Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPayment(txId) {
    await adminVerifyPayment(txId, user.uid);
    await logAdminAction(user.uid, "verify_payment", { txId });
    showToast("Payment verified — funds held", "success");
    await loadAll();
  }

  async function handleVerifyShipment(txId) {
    await adminVerifyShipment(txId, user.uid);
    await logAdminAction(user.uid, "verify_shipment", { txId });
    showToast("Shipment verified — buyer notified", "success");
    await loadAll();
  }

  async function handleRelease(tx) {
    await adminReleaseToSeller(tx.id, tx.adId, user.uid);
    await logAdminAction(user.uid, "release_payment", { txId: tx.id, escrowId: tx.escrowId });
    showToast("Released to seller — deal archived", "success");
    await loadAll();
  }

  async function unlockTransactions() {
    const t = txSearch.trim();
    if (!t) return showToast("Enter escrow ID, email, or phone", "error");
    const byEscrow = transactions.filter((x) => x.escrowId?.toLowerCase() === t.toLowerCase());
    if (byEscrow.length) {
      setTxUnlocked(true);
      return;
    }
    const matchedUsers = await searchUserByEmailOrPhone(t);
    if (matchedUsers.length) {
      setTxUnlocked(true);
      return;
    }
    showToast("No match found", "error");
  }

  const filteredTransactions = useMemo(() => {
    if (!txUnlocked || !txSearch.trim()) return [];
    const t = txSearch.trim().toLowerCase();
    const byEscrow = transactions.filter((x) => x.escrowId?.toLowerCase().includes(t));
    if (byEscrow.length) return byEscrow;
    const userIds = users
      .filter(
        (u) =>
          (u.email || "").toLowerCase().includes(t) ||
          (u.phone || "").includes(txSearch.trim()) ||
          (u.displayName || "").toLowerCase().includes(t)
      )
      .map((u) => u.uid);
    return transactions.filter((x) => userIds.includes(x.buyerId) || userIds.includes(x.sellerId));
  }, [txUnlocked, txSearch, transactions, users]);

  async function openEscrowDeal() {
    const lookup = escrowLookup.trim();
    if (!lookup) return showToast("Enter an escrow ID", "error");
    const tx = await fetchTransactionByEscrowId(lookup);
    if (!tx) return showToast("Escrow ID not found", "error");
    router.push(`/deal/${tx.id}`);
  }

  async function savePayments() {
    await savePaymentSettings(paymentForm);
    showToast("Payment details saved", "success");
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="tk-container py-20 text-center">
        <Shield className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-xl font-bold">Admin access denied</h1>
        <p className="mt-2 text-slate-600">
          Set <code className="rounded bg-slate-100 px-1">role: &quot;admin&quot;</code> in Firestore users doc.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white">
        <div className="tk-container flex flex-wrap items-center justify-between gap-4 py-5">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <Shield className="h-8 w-8 text-sky-600" />
              TrustKar Command Center
            </h1>
            <p className="text-sm text-slate-500">Pakistan escrow operations</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={escrowLookup}
              onChange={(e) => setEscrowLookup(e.target.value)}
              placeholder="Escrow ID"
              className="tk-input !w-36 !py-2 text-xs"
            />
            <button type="button" onClick={openEscrowDeal} className="tk-btn-primary !px-3 !py-2 text-xs">
              Open deal
            </button>
            <input
              value={listingLookup}
              onChange={(e) => setListingLookup(e.target.value)}
              placeholder="Listing ID"
              className="tk-input !w-36 !py-2 text-xs"
            />
            <button
              type="button"
              onClick={async () => {
                const ad = await fetchAdByListingId(listingLookup.trim());
                if (!ad) return showToast("Listing ID not found", "error");
                router.push(`/ad/${ad.id}`);
              }}
              className="tk-btn-outline !px-3 !py-2 text-xs"
            >
              Open ad
            </button>
          </div>
        </div>
        <div className="tk-container flex gap-1 overflow-x-auto pb-3">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
                tab === id ? "bg-sky-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              <Icon size={14} />
              {label}
              {id === "verify" && pendingVerify.length > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">{pendingVerify.length}</span>
              )}
              {id === "shipment" && pendingShipmentVerify.length > 0 && (
                <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{pendingShipmentVerify.length}</span>
              )}
              {id === "release" && pendingRelease.length > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{pendingRelease.length}</span>
              )}
              {id === "returns" && (returnsInTransit.length + rejectedAwaitingReturn.length) > 0 && (
                <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{returnsInTransit.length + rejectedAwaitingReturn.length}</span>
              )}
              {id === "refunds" && pendingReturnReviews.length > 0 && (
                <span className="rounded-full bg-emerald-500 px-1.5 text-[10px] text-white">{pendingReturnReviews.length}</span>
              )}
              {id === "disputes" && openDisputes.length > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 text-[10px] text-white">{openDisputes.length}</span>
              )}
              {id === "approvals" && pendingApprovals.length > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 text-[10px] text-white">{pendingApprovals.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="tk-container py-6">
        {tab === "overview" && <AdminAnalytics ads={ads} users={users} transactions={transactions} />}

        {tab === "verify" && (
          <div className="space-y-4">
            {pendingVerify.length === 0 ? (
              <p className="text-slate-500">No payments awaiting verification.</p>
            ) : (
              pendingVerify.map((t) => (
                <div key={t.id} className="tk-card flex flex-wrap gap-4 !p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t.adTitle}</p>
                    <p className="font-mono text-xs text-cyan-700">{t.escrowId}</p>
                    <p className="text-sm">{formatPrice(t.amount)} · {t.paymentMethod}</p>
                    {t.paymentProofText && <p className="font-mono text-sm">TID: {t.paymentProofText}</p>}
                  </div>
                  {t.paymentProofUrl && (
                    <div className="relative h-24 w-36 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={t.paymentProofUrl} alt="Proof" fill className="object-contain" unoptimized />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(t.id)}
                      className="tk-btn-primary !py-2 text-xs"
                    >
                      <CheckCircle size={14} /> Verify payment
                    </button>
                    <Link href={`/deal/${t.id}`} className="text-xs text-cyan-600 hover:underline flex items-center gap-1">
                      <ExternalLink size={12} /> Deal room
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "shipment" && (
          <div className="space-y-4">
            {pendingShipmentVerify.length === 0 ? (
              <p className="text-slate-500">No shipments awaiting verification.</p>
            ) : (
              pendingShipmentVerify.map((t) => (
                <div key={t.id} className="tk-card flex flex-wrap gap-4 !p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t.adTitle}</p>
                    <p className="font-mono text-xs text-cyan-700">{t.escrowId}</p>
                    <p className="text-sm">{formatPrice(t.amount)}</p>
                    <p className="text-sm font-semibold text-slate-700">Tracking: {t.trackingId}</p>
                    {t.courierName && <p className="text-xs text-slate-500">{t.courierName}</p>}
                  </div>
                  {t.shipmentProofUrl && (
                    <div className="relative h-24 w-36 overflow-hidden rounded-lg bg-slate-100">
                      <Image src={t.shipmentProofUrl} alt="Shipment" fill className="object-contain" unoptimized />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyShipment(t.id)}
                      className="tk-btn-primary !bg-amber-600 !py-2 text-xs"
                    >
                      <CheckCircle size={14} /> Verify shipment
                    </button>
                    <Link href={`/deal/${t.id}`} className="text-xs text-cyan-600 hover:underline flex items-center gap-1">
                      <ExternalLink size={12} /> Deal room
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "returns" && (
          <div className="space-y-6">
            {/* Rejected awaiting return */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Rejected — awaiting buyer return shipment</h3>
              {rejectedAwaitingReturn.length === 0 ? (
                <p className="text-sm text-slate-500">No rejected items awaiting return.</p>
              ) : (
                rejectedAwaitingReturn.map((t) => (
                  <div key={t.id} className="tk-card mb-3 flex flex-wrap items-center justify-between gap-3 !p-4">
                    <div>
                      <p className="font-bold">{t.adTitle}</p>
                      <p className="font-mono text-xs text-cyan-700">{t.escrowId}</p>
                      <p className="text-sm">{formatPrice(t.amount)}</p>
                      <p className="text-xs text-red-600">Reason: {t.rejectionReason || "N/A"}</p>
                    </div>
                    <Link href={`/deal/${t.id}`} className="text-xs text-sky-700 underline">Open deal room →</Link>
                  </div>
                ))
              )}
            </div>

            {/* Returns in transit */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Return shipments in transit</h3>
              {returnsInTransit.length === 0 ? (
                <p className="text-sm text-slate-500">No return shipments in transit.</p>
              ) : (
                returnsInTransit.map((t) => (
                  <div key={t.id} className="tk-card mb-3 flex flex-wrap items-center justify-between gap-3 !p-4">
                    <div>
                      <p className="font-bold">{t.adTitle}</p>
                      <p className="font-mono text-xs text-cyan-700">{t.escrowId}</p>
                      <p className="text-sm">{formatPrice(t.amount)}</p>
                      <p className="text-xs text-slate-600">Return tracking: {t.returnTrackingId} · {t.returnCourierName}</p>
                    </div>
                    <Link href={`/deal/${t.id}`} className="text-xs text-sky-700 underline">Open deal room →</Link>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "refunds" && (
          <div className="space-y-4">
            <h3 className="mb-3 text-sm font-bold text-slate-700">Refunds pending — seller accepted return</h3>
            {pendingReturnReviews.length === 0 ? (
              <p className="text-slate-500">No refunds pending.</p>
            ) : (
              pendingReturnReviews.map((t) => (
                <div key={t.id} className="tk-card flex flex-wrap items-center justify-between gap-3 !p-4">
                  <div>
                    <p className="font-bold">{t.adTitle}</p>
                    <p className="font-mono text-xs text-cyan-700">{t.escrowId}</p>
                    <p className="text-sm">{formatPrice(t.amount)}</p>
                    <p className="text-xs text-emerald-700">Seller accepted return</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await adminRefundBuyer(t.id, user.uid);
                        await logAdminAction(user.uid, "refund_buyer", { txId: t.id, escrowId: t.escrowId });
                        showToast("Refund processed", "success");
                        await loadAll();
                      }}
                      className="tk-btn-primary !bg-red-600 !py-2 text-xs"
                    >
                      <Banknote size={14} /> Process refund
                    </button>
                    <Link href={`/deal/${t.id}`} className="text-xs text-sky-700 underline self-center">Deal room</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "disputes" && (
          <div className="space-y-4">
            {openDisputes.length === 0 && <p className="text-slate-500">No open disputes.</p>}
            {openDisputes.map((d) => (
              <DisputeResolveCard
                key={d.id}
                dispute={d}
                onResolved={loadAll}
                adminId={user.uid}
                resolve={adminResolveDispute}
                showToast={showToast}
              />
            ))}
          </div>
        )}

        {tab === "release" && (
          <div className="space-y-4">
            {pendingRelease.map((t) => (
              <div key={t.id} className="tk-card flex flex-wrap items-center justify-between gap-3 !p-4">
                <div>
                  <p className="font-bold">{t.adTitle}</p>
                  <p className="font-mono text-xs">{t.escrowId}</p>
                  <p className="text-sm text-amber-800">Buyer verified delivery</p>
                </div>
                <button type="button" onClick={() => handleRelease(t)} className="tk-btn-primary !bg-sky-700">
                  Release to seller
                </button>
              </div>
            ))}
            {pendingRelease.length === 0 && <p className="text-slate-500">Nothing pending release.</p>}
          </div>
        )}

        {tab === "approvals" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">New listings stay hidden until you approve them.</p>
            {pendingApprovals.map((ad) => (
              <div key={ad.id} className="tk-card flex flex-wrap justify-between gap-2 !p-4">
                <div>
                  <p className="font-bold">{ad.title}</p>
                  <p className="font-mono text-xs text-sky-700">{ad.listingId}</p>
                  <p className="text-xs text-slate-500">{ad.categoryName} · {formatPrice(ad.price)}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/ad/${ad.id}`} className="text-xs text-sky-700 underline">
                    Preview
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await approveAd(ad.id);
                      showToast("Ad approved — now live", "success");
                      await loadAll();
                    }}
                    className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await rejectAd(ad.id);
                      showToast("Ad rejected", "info");
                      await loadAll();
                    }}
                    className="rounded-lg bg-red-50 px-3 py-1 text-xs text-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingApprovals.length === 0 && <p className="text-slate-500">No ads waiting for approval.</p>}
          </div>
        )}

        {tab === "sponsored" && (
          <div className="space-y-8">
            <div className="tk-card space-y-4 !p-5">
              <h3 className="font-bold">Homepage display (off by default)</h3>
              <p className="text-sm text-slate-600">
                Banners and Google ads stay hidden until you enable them here. Create banners below first, then turn on.
              </p>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={homepageSettings.showPaidBanners === true}
                  onChange={(e) =>
                    setHomepageSettings((s) => ({ ...s, showPaidBanners: e.target.checked }))
                  }
                />
                Show paid banners on homepage
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={homepageSettings.showGoogleAds === true}
                  onChange={(e) =>
                    setHomepageSettings((s) => ({ ...s, showGoogleAds: e.target.checked }))
                  }
                />
                Show Google AdSense on homepage
              </label>
              <input
                className="tk-input !py-2 text-sm"
                placeholder="AdSense client ID (ca-pub-xxxxxxxx)"
                value={homepageSettings.googleAdsClientId || ""}
                onChange={(e) =>
                  setHomepageSettings((s) => ({ ...s, googleAdsClientId: e.target.value }))
                }
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className="tk-input !py-2 text-sm"
                  placeholder="Hero ad slot ID"
                  value={homepageSettings.googleAdSlotHero || ""}
                  onChange={(e) =>
                    setHomepageSettings((s) => ({ ...s, googleAdSlotHero: e.target.value }))
                  }
                />
                <input
                  className="tk-input !py-2 text-sm"
                  placeholder="Mid-page ad slot ID"
                  value={homepageSettings.googleAdSlotMid || ""}
                  onChange={(e) =>
                    setHomepageSettings((s) => ({ ...s, googleAdSlotMid: e.target.value }))
                  }
                />
              </div>
              <button
                type="button"
                className="tk-btn-primary"
                onClick={async () => {
                  await saveHomepageSettings(homepageSettings);
                  showToast("Homepage ad settings saved", "success");
                }}
              >
                Save homepage settings
              </button>
            </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="tk-card space-y-3">
              <h3 className="font-bold">{editingBannerId ? "Edit banner" : "Add paid homepage banner"}</h3>
              <input
                className="tk-input !py-2"
                placeholder="Advertiser title"
                value={bannerForm.title}
                onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
              />
              <input
                className="tk-input !py-2"
                placeholder="Subtitle (optional)"
                value={bannerForm.subtitle}
                onChange={(e) => setBannerForm((f) => ({ ...f, subtitle: e.target.value }))}
              />
              <input
                className="tk-input !py-2"
                placeholder="Link URL (optional)"
                value={bannerForm.linkUrl}
                onChange={(e) => setBannerForm((f) => ({ ...f, linkUrl: e.target.value }))}
              />
              <input
                className="tk-input !py-2"
                placeholder="Image URL (or upload below)"
                value={bannerForm.imageUrl}
                onChange={(e) => setBannerForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />
              {bannerForm.imageUrl && (
                <div className="relative h-24 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  <Image src={bannerForm.imageUrl} alt="Preview" fill className="object-contain" unoptimized />
                </div>
              )}
              <label className="block text-xs font-bold text-slate-500">
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const { secureUrl } = await uploadImageToCloudinary(file, {
                        folder: "trustkar/banners",
                      });
                      setBannerForm((f) => ({ ...f, imageUrl: secureUrl }));
                      showToast("Image uploaded", "success");
                    } catch {
                      showToast("Upload failed", "error");
                    }
                  }}
                />
              </label>
              <select
                className="tk-input !py-2"
                value={bannerForm.slot}
                onChange={(e) => setBannerForm((f) => ({ ...f, slot: e.target.value }))}
              >
                {BANNER_SLOTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="tk-input !py-2"
                placeholder="Fee paid (PKR)"
                value={bannerForm.feePaid}
                onChange={(e) => setBannerForm((f) => ({ ...f, feePaid: e.target.value }))}
              />
              <button
                type="button"
                className="tk-btn-primary w-full"
                onClick={async () => {
                  if (editingBannerId) {
                    await updateSponsoredBanner(editingBannerId, {
                      ...bannerForm,
                      feePaid: Number(bannerForm.feePaid) || 0,
                      order: Number(bannerForm.order) || 0,
                    });
                    showToast("Banner updated", "success");
                    setEditingBannerId(null);
                  } else {
                    await createSponsoredBanner({
                      ...bannerForm,
                      feePaid: Number(bannerForm.feePaid) || 0,
                      order: Number(bannerForm.order) || 0,
                    });
                    showToast("Banner created", "success");
                  }
                  setBannerForm({
                    title: "",
                    subtitle: "",
                    linkUrl: "",
                    imageUrl: "",
                    slot: "hero",
                    order: 0,
                    feePaid: "",
                    active: true,
                  });
                  await loadAll();
                }}
              >
                {editingBannerId ? "Update banner" : "Publish banner"}
              </button>
              {editingBannerId && (
                <button
                  type="button"
                  className="tk-btn-outline w-full"
                  onClick={() => {
                    setEditingBannerId(null);
                    setBannerForm({
                      title: "",
                      subtitle: "",
                      linkUrl: "",
                      imageUrl: "",
                      slot: "hero",
                      order: 0,
                      feePaid: "",
                      active: true,
                    });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {banners.map((b) => (
                <li key={b.id} className="tk-card flex flex-wrap justify-between gap-2 !p-3">
                  <div>
                    <p className="font-bold">{b.title}</p>
                    <p className="text-xs text-slate-500">
                      {b.slot} · {b.active !== false ? "Active" : "Off"} · {formatPrice(b.feePaid || 0)} fee
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBannerId(b.id);
                        setBannerForm({
                          title: b.title || "",
                          subtitle: b.subtitle || "",
                          linkUrl: b.linkUrl || "",
                          imageUrl: b.imageUrl || "",
                          slot: b.slot || "hero",
                          order: b.order ?? 0,
                          feePaid: String(b.feePaid ?? ""),
                          active: b.active !== false,
                        });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-xs font-bold text-sky-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await updateSponsoredBanner(b.id, { active: b.active === false });
                        showToast(b.active === false ? "Banner enabled" : "Banner disabled", "success");
                        await loadAll();
                      }}
                      className="text-xs font-bold text-slate-500"
                    >
                      {b.active !== false ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteSponsoredBanner(b.id);
                        await loadAll();
                      }}
                      className="text-xs text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          </div>
        )}

        {tab === "transactions" && (
          <LockedSection
            search={txSearch}
            setSearch={setTxSearch}
            onSearch={unlockTransactions}
            placeholder="Escrow ID, email, or mobile"
            unlocked={txUnlocked}
          >
            <ul className="mt-4 space-y-2">
              {filteredTransactions.map((t) => {
                const isDisputed = t.status === ESCROW_STATUS.DISPUTED || t.disputeId;
                return (
                  <li key={t.id} className={`tk-card flex flex-wrap justify-between gap-2 !p-3 ${isDisputed ? "border-red-300 bg-red-50/50" : ""}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{t.adTitle}</p>
                        {isDisputed && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">DISPUTE OPEN</span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-cyan-700">{t.escrowId}</p>
                      <p className="text-sm capitalize">{t.status?.replace(/_/g, " ")}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Link href={`/deal/${t.id}`} className="tk-btn-outline !py-1 !text-xs text-center">
                        Open deal room
                      </Link>
                      {isDisputed && (
                        <Link href={`/deal/${t.id}`} className="rounded-full bg-red-100 px-2 py-1 text-center text-[10px] font-bold text-red-700 hover:bg-red-200 transition">
                          Open dispute chat
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </LockedSection>
        )}

        {tab === "ads" && <AdminAdsManager ads={ads} users={users} onRefresh={loadAll} />}

        {tab === "users" && <AdminUserManager users={users} ads={ads} onRefresh={loadAll} />}

        {tab === "payments" && paymentForm && (
          <div className="tk-card max-w-xl space-y-4">
            <h3 className="font-bold">Payment details shown to buyers at checkout</h3>
            {["easypaisa", "jazzcash"].map((key) => (
              <div key={key} className="space-y-2 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-bold capitalize">{key}</p>
                <input
                  className="tk-input !py-2"
                  placeholder="Account number"
                  value={paymentForm[key]?.number || ""}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, [key]: { ...f[key], number: e.target.value } }))
                  }
                />
                <input
                  className="tk-input !py-2"
                  placeholder="Account name"
                  value={paymentForm[key]?.accountName || ""}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, [key]: { ...f[key], accountName: e.target.value } }))
                  }
                />
              </div>
            ))}
            <div className="space-y-2 rounded-xl bg-slate-50 p-3">
              <p className="text-sm font-bold">Bank transfer</p>
              {["bankName", "accountTitle", "accountNumber", "iban"].map((field) => (
                <input
                  key={field}
                  className="tk-input !py-2"
                  placeholder={field}
                  value={paymentForm.bank_transfer?.[field] || ""}
                  onChange={(e) =>
                    setPaymentForm((f) => ({
                      ...f,
                      bank_transfer: { ...f.bank_transfer, [field]: e.target.value },
                    }))
                  }
                />
              ))}
            </div>
            <button type="button" onClick={savePayments} className="tk-btn-primary">
              Save payment details
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
