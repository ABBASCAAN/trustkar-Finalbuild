"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTransactionById,
  fetchAdById,
  fetchUserProfile,
  fetchUserAds,
  getPaymentSettings,
  subscribeDealMessages,
  sendDealMessage,
  submitPaymentProof,
  buyerAcceptItem,
  processTransactionDeadlines,
  sellerSubmitShipment,
  adminVerifyShipment,
  buyerConfirmReceipt,
  buyerRejectItem,
  buyerSubmitReturnShipment,
  sellerReviewReturn,
  adminRefundBuyer,
  subscribeTransaction,
  createNotification,
  createFeaturedAdReview,
  raiseDealDispute,
  fetchDisputeById,
  adminResolveDispute,
} from "@/lib/firestore-helpers";
import {
  ESCROW_STATUS,
  ESCROW_STATUS_LABELS,
  PAYMENT_METHODS,
  DISPATCH_DEADLINE_HOURS,
  DISPUTE_OUTCOMES,
} from "@/lib/constants";
import { formatPrice } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import {
  Shield,
  Loader2,
  Send,
  Upload,
  CheckCircle,
  Copy,
  Truck,
  AlertTriangle,
  User,
  X,
  MapPin,
  Phone,
  Package,
  ZoomIn,
  Sparkles,
  Smartphone,
  Mail,
  Camera,
  Gavel,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { playNotificationSound } from "@/lib/sound";

const ROLE_COLORS = {
  buyer: "bg-sky-50 border-sky-200 text-sky-900",
  seller: "bg-emerald-50 border-emerald-200 text-emerald-900",
  admin: "bg-slate-50 border-slate-200 text-slate-900",
};

const ROLE_LABELS = {
  buyer: "Buyer",
  seller: "Seller",
  admin: "Escrow",
};

export default function DealRoomPage() {
  const { id } = useParams();
  const { user, profile, isAdmin } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const chatEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const soundInitRef = useRef(false);
  const lastMessageIdRef = useRef(null);
  const shouldScrollRef = useRef(true);

  const [tx, setTx] = useState(null);
  const [ad, setAd] = useState(null);
  const [messages, setMessages] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [tidText, setTidText] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("easypaisa");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [courierName, setCourierName] = useState("");
  const [shipmentFile, setShipmentFile] = useState(null);
  const [shipping, setShipping] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState(null);
  const [profileModalData, setProfileModalData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFeaturedReviewModal, setShowFeaturedReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [profileModalAds, setProfileModalAds] = useState([]);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [zoomedIn, setZoomedIn] = useState(false);

  /* Rejection / Return flow state */
  const [rejectReason, setRejectReason] = useState("");
  const [rejectEvidenceFiles, setRejectEvidenceFiles] = useState([]);
  const [rejecting, setRejecting] = useState(false);
  const [returnTrackingId, setReturnTrackingId] = useState("");
  const [returnCourierName, setReturnCourierName] = useState("");
  const [returnShipmentFile, setReturnShipmentFile] = useState(null);
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  /* Dispute state (integrated in deal room) */
  const [disputeData, setDisputeData] = useState(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeEvidenceFiles, setDisputeEvidenceFiles] = useState([]);
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  /* Chat image upload */
  const [chatImageFile, setChatImageFile] = useState(null);
  const [chatImagePreview, setChatImagePreview] = useState(null);

  /* Admin resolution */
  const [resolveOutcome, setResolveOutcome] = useState(DISPUTE_OUTCOMES.FULL_REFUND);
  const [resolvePartial, setResolvePartial] = useState("");
  const [resolveNote, setResolveNote] = useState("");
  const [resolving, setResolving] = useState(false);

  const isBuyer = tx?.buyerId === user?.uid;
  const isSeller = tx?.sellerId === user?.uid;

  useEffect(() => {
    if (!user) {
      router.replace(`/auth/login?redirect=/deal/${id}`);
      return;
    }
    load();
  }, [id, user]);

  useEffect(() => {
    if (!id || !user) return;
    const unsub = subscribeDealMessages(id, setMessages);
    return () => unsub();
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeTransaction(id, (data) => {
      if (data) setTx(data);
    });
    return () => unsub();
  }, [id]);

  // Live “new chat message” sound + toast.
  useEffect(() => {
    if (!user) return;
    if (tx?.chatArchived) return;
    if (!messages.length) return;

    const last = messages[messages.length - 1];
    if (!last?.id) return;

    if (!soundInitRef.current) {
      soundInitRef.current = true;
      lastMessageIdRef.current = last.id;
      return;
    }

    // Only notify when the other party sends a new message.
    if (last.senderId !== user.uid && last.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = last.id;
      playNotificationSound();
      showToast("New message in deal", "info");
    }
  }, [messages, user, tx, showToast]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom || shouldScrollRef.current) {
      container.scrollTop = container.scrollHeight;
      shouldScrollRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (!id || !user || loading) return;
    const tick = setInterval(() => {
      processTransactionDeadlines(id).then((updated) => {
        if (updated) setTx(updated);
      });
    }, 60000);
    return () => clearInterval(tick);
  }, [id, user, loading]);

  useEffect(() => {
    if (!tx) return;
    if (tx.buyerId) {
      fetchUserProfile(tx.buyerId).then(setBuyerProfile).catch(() => setBuyerProfile(null));
    }
    if (tx.sellerId) {
      fetchUserProfile(tx.sellerId).then(setSellerProfile).catch(() => setSellerProfile(null));
    }
  }, [tx]);

  async function load() {
    let txData = await processTransactionDeadlines(id);
    if (!txData) txData = await fetchTransactionById(id);
    if (!txData) {
      setLoading(false);
      return;
    }
    const allowed =
      isAdmin ||
      txData.buyerId === user.uid ||
      txData.sellerId === user.uid;
    if (!allowed) {
      router.replace("/dashboard");
      return;
    }
    setTx(txData);
    if (txData.adId) {
      const adData = await fetchAdById(txData.adId);
      setAd(adData);
    }
    setPaymentSettings(await getPaymentSettings());
    if (txData.buyerId) {
      const bp = await fetchUserProfile(txData.buyerId);
      setBuyerProfile(bp);
    }
    if (txData.sellerId) {
      const sp = await fetchUserProfile(txData.sellerId);
      setSellerProfile(sp);
    }
    if (txData.status === ESCROW_STATUS.DISPUTED && txData.disputeId) {
      const d = await fetchDisputeById(txData.disputeId);
      setDisputeData(d);
    }
    setLoading(false);
  }

  function myRole() {
    if (isAdmin) return "admin";
    if (tx?.buyerId === user?.uid) return "buyer";
    if (tx?.sellerId === user?.uid) return "seller";
    return "buyer";
  }

  async function openProfileModal(uid) {
    if (!uid) return;
    setProfileModalUserId(uid);
    setProfileModalLoading(true);
    try {
      const [prof, adsList] = await Promise.all([fetchUserProfile(uid), fetchUserAds(uid)]);
      setProfileModalData(prof);
      setProfileModalAds(adsList?.filter((a) => a.status === "active") || []);
    } catch {
      setProfileModalData(null);
      setProfileModalAds([]);
    } finally {
      setProfileModalLoading(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!user || !text.trim() || tx?.chatArchived) return;
    setSending(true);
    try {
      const name = myRole() === "buyer"
        ? (buyerProfile?.displayName || tx.buyerName || "Buyer")
        : myRole() === "seller"
        ? (sellerProfile?.displayName || tx.sellerName || "Seller")
        : "Admin";
      await sendDealMessage(id, {
        senderId: user.uid,
        senderRole: myRole(),
        senderName: name,
        text: text.trim(),
      });
      setText("");
      shouldScrollRef.current = true;
      if (myRole() === "seller") {
        await createNotification({
          userId: tx?.buyerId,
          type: "seller_reply",
          title: "New message in deal",
          body: `Seller replied on ${tx?.adTitle}`,
          link: `/deal/${id}`,
        });
      }
    } catch {
      showToast("Could not send message", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleSendChatImage(file) {
    const imageFile = file || chatImageFile;
    if (!imageFile || !user) return;
    setSending(true);
    try {
      const up = await uploadImageToCloudinary(imageFile, { folder: "trustkar/chat" });
      const name = myRole() === "buyer"
        ? (buyerProfile?.displayName || tx.buyerName || "Buyer")
        : myRole() === "seller"
        ? (sellerProfile?.displayName || tx.sellerName || "Seller")
        : "Admin";
      await sendDealMessage(id, {
        senderId: user.uid,
        senderRole: myRole(),
        senderName: name,
        text: "",
        imageUrl: up.secureUrl,
      });
      setChatImageFile(null);
      setChatImagePreview(null);
      shouldScrollRef.current = true;
    } catch {
      showToast("Could not send image", "error");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmitDispute() {
    if (!disputeReason.trim()) {
      showToast("Select a reason for the dispute", "error");
      return;
    }
    if (!disputeDescription.trim()) {
      showToast("Enter a description", "error");
      return;
    }
    if (disputeEvidenceFiles.length === 0) {
      showToast("Upload at least one photo or video as evidence", "error");
      return;
    }
    setDisputeSubmitting(true);
    try {
      const evidenceUrls = [];
      for (const file of disputeEvidenceFiles) {
        const up = await uploadImageToCloudinary(file, { folder: "trustkar/disputes" });
        evidenceUrls.push(up.secureUrl);
      }
      await raiseDealDispute(id, user.uid, {
        reason: disputeReason.trim(),
        description: disputeDescription.trim(),
        evidenceUrls,
      });
      showToast("Dispute opened — admin will review", "success");
      setShowDisputeForm(false);
      setDisputeReason("");
      setDisputeDescription("");
      setDisputeEvidenceFiles([]);
      await load();
    } catch (err) {
      showToast(err.message || "Failed to open dispute", "error");
    } finally {
      setDisputeSubmitting(false);
    }
  }

  async function handleResolveDispute() {
    if (!isAdmin || !disputeData) return;
    setResolving(true);
    try {
      await adminResolveDispute(disputeData.id, user.uid, {
        outcome: resolveOutcome,
        partialAmount: resolveOutcome === DISPUTE_OUTCOMES.PARTIAL_REFUND ? Number(resolvePartial) : null,
        note: resolveNote,
      });
      showToast("Dispute resolved", "success");
      const d = await fetchDisputeById(disputeData.id);
      setDisputeData(d);
      await load();
    } catch (err) {
      showToast(err.message || "Failed to resolve", "error");
    } finally {
      setResolving(false);
    }
  }

  async function handleSubmitPayment() {
    if (!tidText.trim() && !receiptFile) {
      showToast("Enter transaction ID or upload screenshot", "error");
      return;
    }
    setUploading(true);
    try {
      let imageUrl = null;
      if (receiptFile) {
        const up = await uploadImageToCloudinary(receiptFile, { folder: "trustkar/receipts" });
        imageUrl = up.secureUrl;
      }
      await submitPaymentProof(id, {
        text: tidText.trim(),
        imageUrl,
        method: paymentMethod,
      });
      showToast("Submitted — pending admin verification", "success");
      await load();
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleAcceptItem() {
    if (!confirm("Confirm you received the item in good condition?")) return;
    try {
      await buyerAcceptItem(id, user.uid);
      showToast("Accepted — admin will release payment to seller", "success");
      await load();
    } catch (e) {
      showToast(e.message || "Could not accept", "error");
    }
  }

  async function handleSubmitShipment() {
    if (!trackingId.trim()) {
      showToast("Tracking ID is required", "error");
      return;
    }
    setShipping(true);
    try {
      let proofUrl = null;
      if (shipmentFile) {
        const up = await uploadImageToCloudinary(shipmentFile, { folder: "trustkar/shipment" });
        proofUrl = up.secureUrl;
      }
      await sellerSubmitShipment(id, user.uid, {
        trackingId,
        courierName,
        proofUrl,
      });
      showToast("Shipment submitted — buyer notified", "success");
      setTrackingId("");
      setCourierName("");
      setShipmentFile(null);
      await load();
    } catch (e) {
      showToast(e.message || "Could not submit shipment", "error");
    } finally {
      setShipping(false);
    }
  }

  async function handleRejectItem() {
    if (!rejectReason.trim()) {
      showToast("Please provide a reason for rejection", "error");
      return;
    }
    if (!confirm("Are you sure you want to reject this item? This will start the return process.")) return;
    setRejecting(true);
    try {
      const evidenceUrls = [];
      for (const file of rejectEvidenceFiles) {
        const up = await uploadImageToCloudinary(file, { folder: "trustkar/reject-evidence" });
        evidenceUrls.push(up.secureUrl);
      }
      await buyerRejectItem(id, user.uid, {
        reason: rejectReason.trim(),
        evidenceUrls,
      });
      showToast("Item rejected — return process started", "success");
      setRejectReason("");
      setRejectEvidenceFiles([]);
      await load();
    } catch (e) {
      showToast(e.message || "Could not reject item", "error");
    } finally {
      setRejecting(false);
    }
  }

  async function handleSubmitReturnShipment() {
    if (!returnTrackingId.trim()) {
      showToast("Return tracking ID is required", "error");
      return;
    }
    setReturnSubmitting(true);
    try {
      let proofUrl = null;
      if (returnShipmentFile) {
        const up = await uploadImageToCloudinary(returnShipmentFile, { folder: "trustkar/return-shipment" });
        proofUrl = up.secureUrl;
      }
      await buyerSubmitReturnShipment(id, user.uid, {
        trackingId: returnTrackingId,
        courierName: returnCourierName,
        proofUrl,
      });
      showToast("Return shipment submitted", "success");
      setReturnTrackingId("");
      setReturnCourierName("");
      setReturnShipmentFile(null);
      await load();
    } catch (e) {
      showToast(e.message || "Could not submit return shipment", "error");
    } finally {
      setReturnSubmitting(false);
    }
  }

  async function handleSellerReviewReturn(accept) {
    if (!confirm(accept ? "Confirm you received the item in acceptable condition?" : "You are rejecting the return. This will open a dispute.")) return;
    try {
      await sellerReviewReturn(id, user.uid, { accept, note: "" });
      showToast(accept ? "Return accepted — refund pending" : "Return rejected — dispute opened", "success");
      await load();
    } catch (e) {
      showToast(e.message || "Could not process return review", "error");
    }
  }

  async function handleAdminRefund() {
    if (!confirm("Process full refund to buyer?")) return;
    try {
      await adminRefundBuyer(id, user.uid);
      showToast("Refund processed", "success");
      await load();
    } catch (e) {
      showToast(e.message || "Could not process refund", "error");
    }
  }

  function renderPaymentDetails() {
    if (!paymentSettings) return null;
    const m = paymentSettings[paymentMethod];
    if (!m) return null;
    if (paymentMethod === "bank_transfer") {
      return (
        <div className="space-y-1 text-sm">
          <p><strong>{m.bankName}</strong></p>
          <p>{m.accountTitle}</p>
          <p className="font-mono">{m.accountNumber}</p>
          {m.iban && <p className="font-mono text-xs">IBAN: {m.iban}</p>}
        </div>
      );
    }
    return (
      <div className="space-y-1 text-sm">
        <p className="font-bold">{m.title || paymentMethod}</p>
        <p className="font-mono text-lg">{m.number}</p>
        <p className="text-slate-600">{m.accountName}</p>
      </div>
    );
  }

  const isBuyerRole = tx?.buyerId === user?.uid;

  function statusMessage() {
    switch (tx?.status) {
      case ESCROW_STATUS.PAYMENT_PENDING:
        return isBuyerRole
          ? "Pay using details below, then upload TID or screenshot."
          : "Waiting for buyer to complete payment.";
      case ESCROW_STATUS.PENDING_VERIFICATION:
        return "Waiting for admin approval — TrustKar team will confirm shortly.";
      case ESCROW_STATUS.FUNDS_HELD:
        return isBuyerRole
          ? "Awaiting shipment from seller. Kindly Wait."
          : `Kindly Ship Item Within ${DISPATCH_DEADLINE_HOURS} hours.`;
      case ESCROW_STATUS.PENDING_SHIPMENT_VERIFY:
        return "Waiting for admin approval — shipment proof under review.";
      case ESCROW_STATUS.DISPATCHED:
        return isBuyerRole
          ? "Shipment on the way — click 'Item received' once you get it."
          : "Waiting for buyer to receive items.";
      case ESCROW_STATUS.INSPECTION:
        return isBuyerRole
          ? "Item received. You have 24 hours to inspect, confirm satisfaction, or report an issue."
          : "Buyer received the item and is inspecting.";
      case ESCROW_STATUS.DISPUTED:
        return "Dispute open — funds frozen until admin resolves.";
      case ESCROW_STATUS.CANCELLED:
        return tx.cancelReason || "Deal cancelled.";
      case ESCROW_STATUS.PENDING_RELEASE:
        return isAdmin || myRole() === "seller"
          ? "Buyer verified delivery — pending release to seller."
          : "You verified receipt. Admin will pay the seller.";
      case ESCROW_STATUS.RELEASED:
        return "Deal completed. Payment released to seller.";
      case ESCROW_STATUS.REJECTED:
        return isBuyerRole
          ? `You rejected the item. Ship it back within the deadline.`
          : "Buyer rejected the item. Waiting for return shipment.";
      case ESCROW_STATUS.RETURN_IN_TRANSIT:
        return isBuyerRole
          ? "Return shipment submitted. Seller will review when it arrives."
          : "Buyer shipped the item back. Review it when it arrives.";
      case ESCROW_STATUS.SELLER_REVIEW:
        return isBuyerRole
          ? "Seller accepted the return. Refund will be processed shortly."
          : "You accepted the return. TrustKar will process the refund.";
      case ESCROW_STATUS.REFUNDED:
        return "Deal closed. Buyer has been refunded.";
      default:
        return ESCROW_STATUS_LABELS[tx?.status] || tx?.status;
    }
  }

  useEffect(() => {
    if (tx?.status === ESCROW_STATUS.RELEASED) {
      const alreadyShown = typeof window !== "undefined" && localStorage.getItem(`deal_closed_modal_${id}`);
      if (!alreadyShown) {
        setShowSuccessModal(true);
      }
      if (
        isSeller &&
        ad?.featured &&
        !localStorage.getItem(`featured_review_${id}`)
      ) {
        setShowFeaturedReviewModal(true);
      }
      const reviewFeatured = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reviewFeatured") === "1";
      if (reviewFeatured && isSeller && ad?.featured) {
        setShowFeaturedReviewModal(true);
      }
    }
  }, [tx?.status, id, ad?.featured, isSeller]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
      <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="tk-container py-20 text-center">
        <p>Deal not found.</p>
        <Link href="/dashboard" className="mt-4 text-cyan-600">Dashboard</Link>
      </div>
    );
  }

  const canPay = isBuyer && tx.status === ESCROW_STATUS.PAYMENT_PENDING;
  const canShip =
    isSeller && tx.status === ESCROW_STATUS.FUNDS_HELD && tx.status !== ESCROW_STATUS.DISPUTED;
  const canConfirmReceipt = isBuyer && tx.status === ESCROW_STATUS.DISPATCHED;
  const canAccept = isBuyer && tx.status === ESCROW_STATUS.INSPECTION;
  const canReject = isBuyer && [ESCROW_STATUS.INSPECTION, ESCROW_STATUS.DISPATCHED, ESCROW_STATUS.PENDING_RELEASE].includes(tx.status);
  const canSubmitReturn = isBuyer && tx.status === ESCROW_STATUS.REJECTED;
  const canReviewReturn = isSeller && tx.status === ESCROW_STATUS.RETURN_IN_TRANSIT;
  const canAdminRefund = isAdmin && tx.status === ESCROW_STATUS.SELLER_REVIEW;
  const canDispute = (isBuyer || isSeller) && tx.status === ESCROW_STATUS.INSPECTION;
  const canAdminVerifyShipment = isAdmin && tx.status === ESCROW_STATUS.PENDING_SHIPMENT_VERIFY;
  const isDealClosed = [ESCROW_STATUS.RELEASED, ESCROW_STATUS.CANCELLED, ESCROW_STATUS.REFUNDED].includes(tx.status);
  const canChat = !isDealClosed && !tx.chatArchived;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/90 to-[var(--tk-bg)] pb-24">
      <div className="border-b border-sky-200/80 bg-white/90 backdrop-blur-sm">
        <div className="tk-container flex flex-col gap-3 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700 sm:text-xs">Escrow deal room</p>
            <h1 className="text-lg font-black text-slate-900 sm:text-xl sm:text-2xl">{tx.adTitle}</h1>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(tx.escrowId);
                showToast("Escrow ID copied", "success");
              }}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-sky-900 hover:bg-sky-200 sm:mt-1.5 sm:px-3 sm:py-1 sm:text-xs"
            >
              {tx.escrowId} <Copy size={12} />
            </button>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold text-slate-500 sm:text-xs">Deal amount</p>
            <p className="text-xl font-black text-sky-700 sm:text-2xl">{formatPrice(tx.amount)}</p>
            {tx.escrowFee != null && (
              <p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">
                Fee {tx.feePercent ?? 2.5}%: {formatPrice(tx.escrowFee)} · Seller gets{" "}
                {formatPrice(tx.sellerPayout ?? tx.amount - tx.escrowFee)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="tk-container py-6 lg:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="tk-card flex min-h-[420px] flex-col !p-0">
            {/* Participants header — clickable profiles, grid centered */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-slate-100 px-3 py-2 sm:px-4 sm:py-3">
              {/* Buyer left */}
              <div className="justify-self-start">
                <button
                  type="button"
                  onClick={() => openProfileModal(tx.buyerId)}
                  className="flex items-center gap-1.5 rounded-xl p-1 transition hover:bg-sky-50 sm:gap-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 sm:h-9 sm:w-9">
                    {buyerProfile?.photoURL || tx.buyerPhoto ? (
                      <Image src={buyerProfile?.photoURL || tx.buyerPhoto} alt="" width={36} height={36} className="rounded-full object-cover" unoptimized />
                    ) : (
                      <User size={16} className="sm:h-[18px] sm:w-[18px]" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-bold uppercase text-sky-600 sm:text-[10px]">Buyer</p>
                    <p className="max-w-[70px] truncate text-[11px] font-semibold text-slate-700 sm:max-w-[100px] sm:text-xs sm:max-w-[140px]">{buyerProfile?.displayName || tx.buyerName || "Buyer"}</p>
                  </div>
                </button>
              </div>
              {/* Escrow center — perfectly centered over chat */}
              <div className="flex flex-col items-center justify-self-center">
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700 sm:text-[10px]">Escrow Team</span>
                <span className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">Secured</span>
              </div>
              {/* Seller right */}
              <div className="justify-self-end">
                <button
                  type="button"
                  onClick={() => openProfileModal(tx.sellerId)}
                  className="flex items-center gap-1.5 rounded-xl p-1 transition hover:bg-emerald-50 sm:gap-2"
                >
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase text-emerald-600 sm:text-[10px]">Seller</p>
                    <p className="max-w-[70px] truncate text-[11px] font-semibold text-slate-700 sm:max-w-[100px] sm:text-xs sm:max-w-[140px]">{sellerProfile?.displayName || tx.sellerName || "Seller"}</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 sm:h-9 sm:w-9">
                    {sellerProfile?.photoURL || tx.sellerPhoto ? (
                      <Image src={sellerProfile?.photoURL || tx.sellerPhoto} alt="" width={36} height={36} className="rounded-full object-cover" unoptimized />
                    ) : (
                      <User size={16} className="sm:h-[18px] sm:w-[18px]" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Dispute banner & evidence — integrated in deal room */}
            {tx.status === ESCROW_STATUS.DISPUTED && disputeData && (
              <div className="space-y-3 border-b border-red-100 bg-red-50/40 p-3 sm:p-4">
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <AlertTriangle size={18} className="text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-800">Dispute active — funds frozen</p>
                    <p className="text-xs text-red-700">Reason: {disputeData.reason}</p>
                  </div>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                    {disputeData.status}
                  </span>
                </div>

                {disputeData.description && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Description</p>
                    <p className="mt-1 text-sm text-slate-700">{disputeData.description}</p>
                  </div>
                )}

                {disputeData.evidenceUrls?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase text-slate-400">Evidence</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {disputeData.evidenceUrls.map((url, i) => (
                        <button key={i} type="button" onClick={() => setZoomImageUrl(url)} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                          <Image src={url} alt="" fill className="object-cover" unoptimized />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Both parties can upload more evidence via chat images */}
                <p className="text-xs text-center text-slate-500">
                  Use the image button in chat below to upload additional evidence.
                </p>

                {/* Admin resolution panel */}
                {isAdmin && disputeData.status === "open" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Gavel size={16} />
                      <p className="text-sm font-bold">Resolve dispute</p>
                    </div>
                    <div className="mt-2 space-y-2">
                      <select
                        value={resolveOutcome}
                        onChange={(e) => setResolveOutcome(e.target.value)}
                        className="tk-input w-full !py-2 text-sm"
                      >
                        <option value={DISPUTE_OUTCOMES.FULL_REFUND}>Full refund to buyer</option>
                        <option value={DISPUTE_OUTCOMES.PARTIAL_REFUND}>Partial refund</option>
                        <option value={DISPUTE_OUTCOMES.RELEASE_SELLER}>Release to seller</option>
                      </select>
                      {resolveOutcome === DISPUTE_OUTCOMES.PARTIAL_REFUND && (
                        <input
                          type="number"
                          placeholder="Refund amount PKR"
                          value={resolvePartial}
                          onChange={(e) => setResolvePartial(e.target.value)}
                          className="tk-input w-full !py-2 text-sm"
                        />
                      )}
                      <input
                        placeholder="Resolution note (optional)"
                        value={resolveNote}
                        onChange={(e) => setResolveNote(e.target.value)}
                        className="tk-input w-full !py-2 text-sm"
                      />
                      <button
                        type="button"
                        disabled={resolving}
                        onClick={handleResolveDispute}
                        className="tk-btn-primary w-full !bg-sky-700 text-sm"
                      >
                        {resolving ? <Loader2 className="animate-spin" size={16} /> : "Resolve dispute"}
                      </button>
                    </div>
                  </div>
                )}

                {disputeData.status === "resolved" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle size={16} />
                      <p className="text-sm font-bold">Resolved</p>
                    </div>
                    <p className="mt-1 text-xs text-emerald-700">
                      Outcome: {disputeData.outcome || "N/A"}
                      {disputeData.partialAmount ? ` · PKR ${disputeData.partialAmount.toLocaleString()}` : ""}
                    </p>
                    {disputeData.resolutionNote && (
                      <p className="mt-1 text-xs text-emerald-600">{disputeData.resolutionNote}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Chat area */}
            <div ref={chatScrollRef} className="flex-1 space-y-2 overflow-y-auto p-2 sm:space-y-3 sm:p-4" style={{ maxHeight: "min(70vh, 520px)" }}>
              {messages.length === 0 && (
                <p className="text-center text-sm text-slate-400">Start the conversation…</p>
              )}
              {messages.map((m) => {
                const isMe = m.senderId === user?.uid;
                const isSystem = m.system === true || m.senderId === "system";
                const roleLabel = ROLE_LABELS[m.senderRole] || m.senderRole;
                const displayName = m.senderName || roleLabel;
                const timeStr = m.createdAt
                  ? (m.createdAt?.toDate
                      ? m.createdAt.toDate().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
                      : new Date(m.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }))
                  : null;

                if (isSystem || m.senderRole === "admin") {
                  return (
                    <div key={m.id} className="flex justify-center">
                      <div className="max-w-[92%] rounded-2xl bg-sky-50 px-4 py-2 text-center text-xs font-medium text-sky-800 shadow-sm">
                        <p className="text-center font-bold">Escrow Team</p>
                        <p className="mt-0.5 text-center">{m.text}</p>
                        {timeStr && <p className="mt-1 text-center text-[10px] opacity-60">{timeStr}</p>}
                      </div>
                    </div>
                  );
                }

                const isBuyerMsg = m.senderRole === "buyer";
                const isSellerMsg = m.senderRole === "seller";

                return (
                  <div key={m.id} className={`flex ${isBuyerMsg ? "justify-start" : isSellerMsg ? "justify-end" : "justify-center"}`}>
                    <div className={`max-w-[92%] rounded-2xl border px-2.5 py-2 text-sm sm:max-w-[85%] sm:px-3 ${
                      isBuyerMsg
                        ? "bg-sky-50 border-sky-200 text-sky-900"
                        : isSellerMsg
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : ROLE_COLORS[m.senderRole]
                    }`}>
                      <p className="text-[10px] font-bold uppercase opacity-70">
                        {displayName}{isMe ? " · You" : ""}
                      </p>
                      <p className="mt-0.5">{m.text}</p>
                      {m.imageUrl && (
                        <button
                          type="button"
                          onClick={() => { setZoomImageUrl(m.imageUrl); setZoomedIn(false); }}
                          className={`group relative mt-1.5 block overflow-hidden rounded-lg border border-slate-200 ${
                            m.text ? "h-16 w-16 sm:h-20 sm:w-20" : "h-32 w-32 sm:h-40 sm:w-40"
                          }`}
                        >
                          <Image src={m.imageUrl} alt="Attachment" fill className="object-cover transition group-hover:scale-110" unoptimized />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                            <ZoomIn size={14} className="text-white opacity-0 transition group-hover:opacity-100 sm:size-5" />
                          </div>
                        </button>
                      )}
                      {timeStr && (
                        <p className="mt-1 text-[10px] opacity-50">{timeStr}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={chatEndRef} />
            </div>

            {/* Inline action cards */}
            <div className="space-y-3 border-t border-slate-100 bg-slate-50/40 px-4 py-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {canPay && (
                  <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 space-y-3 sm:p-4 sm:col-span-2">
                    <p className="text-sm font-bold flex items-center gap-2"><Shield size={14} className="text-sky-600"/> Pay to TrustKar</p>
                    <div className="flex flex-wrap gap-1">
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`rounded-full px-3 py-1 text-xs font-bold ${paymentMethod === pm.id ? "bg-cyan-600 text-white" : "bg-slate-100"}`}
                        >
                          {pm.name}
                        </button>
                      ))}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">{renderPaymentDetails()}</div>
                    <input value={tidText} onChange={(e) => setTidText(e.target.value)} placeholder="Transaction ID (text)" className="tk-input !py-2 text-sm w-full" />
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-xs font-semibold text-slate-600">
                      <Upload size={16} /> Screenshot (optional)
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setReceiptFile(e.target.files?.[0])} />
                    </label>
                    <button type="button" onClick={handleSubmitPayment} disabled={uploading} className="tk-btn-primary w-full">
                      {uploading ? <Loader2 className="animate-spin" size={18} /> : "Submit payment proof"}
                    </button>
                  </div>
                )}

                {canShip && (
                  <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 space-y-3 sm:p-4 sm:col-span-2">
                    <p className="text-sm font-bold flex items-center gap-2"><Truck size={14} className="text-sky-600"/> Submit shipment</p>
                    <input value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="Courier (TCS, Leopards…)" className="tk-input !py-2 text-sm w-full" />
                    <input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="Tracking ID *" className="tk-input !py-2 text-sm w-full" />
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600">
                      <Upload size={14} /> Proof photo (optional)
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setShipmentFile(e.target.files?.[0])} />
                    </label>
                    <button type="button" onClick={handleSubmitShipment} disabled={shipping} className="tk-btn-primary w-full">
                      {shipping ? <Loader2 className="animate-spin" size={18} /> : "Mark as dispatched"}
                    </button>
                  </div>
                )}

                {canAdminVerifyShipment && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await adminVerifyShipment(id, user.uid);
                        showToast("Shipment verified — buyer notified", "success");
                        await load();
                      } catch (e) {
                        showToast(e.message || "Could not verify shipment", "error");
                      }
                    }}
                    className="tk-btn-primary w-full !bg-amber-600 sm:col-span-2"
                  >
                    <CheckCircle size={18} /> Verify shipment
                  </button>
                )}

                {canConfirmReceipt && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await buyerConfirmReceipt(id, user.uid);
                        showToast("Item received — inspection window opened", "success");
                        await load();
                      } catch (e) {
                        showToast(e.message || "Could not confirm receipt", "error");
                      }
                    }}
                    className="tk-btn-primary w-full !bg-sky-600 sm:col-span-2"
                  >
                    <CheckCircle size={18} /> Confirm received product
                  </button>
                )}

                {canAccept && (
                  <button type="button" onClick={handleAcceptItem} className="tk-btn-primary w-full !bg-sky-600 sm:col-span-2">
                    <CheckCircle size={18} /> Satisfied by the product — Confirm
                  </button>
                )}

                {canDispute && (
                  <div className="sm:col-span-2">
                    {!showDisputeForm ? (
                      <button
                        type="button"
                        onClick={() => setShowDisputeForm(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-bold text-red-700"
                      >
                        <AlertTriangle size={16} /> Report issue / Open dispute
                      </button>
                    ) : (
                      <div className="rounded-xl border border-red-100 bg-white p-4 shadow-sm space-y-3">
                        <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                          <AlertTriangle size={14} /> Open dispute — evidence required
                        </p>
                        <select
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="tk-input w-full text-sm"
                        >
                          <option value="">Select reason…</option>
                          <option value="Wrong item received">Wrong item received</option>
                          <option value="Counterfeit / fake">Counterfeit / fake</option>
                          <option value="Damaged item">Damaged item</option>
                          <option value="Missing parts">Missing parts</option>
                          <option value="Not as described">Not as described</option>
                          <option value="Seller not cooperating">Seller not cooperating</option>
                          <option value="Other">Other</option>
                        </select>
                        <textarea
                          value={disputeDescription}
                          onChange={(e) => setDisputeDescription(e.target.value)}
                          placeholder="Describe the issue in detail…"
                          className="tk-input h-20 w-full resize-none text-sm"
                        />
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-red-300 px-3 py-2 text-xs font-semibold text-red-700">
                          <Upload size={14} /> Upload evidence photos/videos (mandatory)
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => setDisputeEvidenceFiles(Array.from(e.target.files || []))}
                          />
                        </label>
                        {disputeEvidenceFiles.length > 0 && (
                          <p className="text-xs text-slate-500">{disputeEvidenceFiles.length} file(s) selected</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSubmitDispute}
                            disabled={disputeSubmitting}
                            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                          >
                            {disputeSubmitting ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Submit dispute with evidence"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDisputeForm(false);
                              setDisputeEvidenceFiles([]);
                            }}
                            className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Buyer reject item */}
                {canReject && (
                  <div className="rounded-xl border border-red-100 bg-white p-3 shadow-sm space-y-3 sm:p-4 sm:col-span-2">
                    <p className="text-sm font-bold flex items-center gap-2 text-red-700">
                      <AlertTriangle size={14} /> Reject item — start return
                    </p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason: Wrong item, damaged, not as described, etc."
                      className="tk-input h-20 w-full resize-none text-sm"
                    />
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600">
                      <Upload size={14} /> Add photos / videos as evidence
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={(e) => setRejectEvidenceFiles(Array.from(e.target.files || []))}
                      />
                    </label>
                    {rejectEvidenceFiles.length > 0 && (
                      <p className="text-xs text-slate-500">{rejectEvidenceFiles.length} file(s) selected</p>
                    )}
                    <button
                      type="button"
                      onClick={handleRejectItem}
                      disabled={rejecting}
                      className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {rejecting ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Reject item & start return"}
                    </button>
                  </div>
                )}

                {/* Buyer submit return shipment */}
                {canSubmitReturn && (
                  <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 space-y-3 sm:p-4 sm:col-span-2">
                    <p className="text-sm font-bold flex items-center gap-2"><Truck size={14} className="text-sky-600"/> Ship item back</p>
                    <input value={returnCourierName} onChange={(e) => setReturnCourierName(e.target.value)} placeholder="Courier (TCS, Leopards…)" className="tk-input !py-2 text-sm w-full" />
                    <input value={returnTrackingId} onChange={(e) => setReturnTrackingId(e.target.value)} placeholder="Return Tracking ID *" className="tk-input !py-2 text-sm w-full" />
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600">
                      <Upload size={14} /> Proof photo (optional)
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setReturnShipmentFile(e.target.files?.[0])} />
                    </label>
                    <button type="button" onClick={handleSubmitReturnShipment} disabled={returnSubmitting} className="tk-btn-primary w-full">
                      {returnSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Submit return shipment"}
                    </button>
                  </div>
                )}

                {/* Seller review returned item */}
                {canReviewReturn && (
                  <div className="rounded-xl border border-amber-100 bg-white p-3 shadow-sm space-y-3 sm:p-4 sm:col-span-2">
                    <p className="text-sm font-bold flex items-center gap-2 text-amber-700">
                      <Package size={14} /> Review returned item
                    </p>
                    <p className="text-xs text-slate-500">
                      Tracking: {tx.returnTrackingId || "N/A"} · Courier: {tx.returnCourierName || "N/A"}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSellerReviewReturn(true)}
                        className="tk-btn-primary flex-1 !bg-emerald-600"
                      >
                        <CheckCircle size={16} /> Accept return
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSellerReviewReturn(false)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 py-2.5 text-sm font-bold text-red-700 border border-red-200 hover:bg-red-100"
                      >
                        <AlertTriangle size={16} /> Reject return
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin refund button */}
                {canAdminRefund && (
                  <button
                    type="button"
                    onClick={handleAdminRefund}
                    className="tk-btn-primary w-full !bg-red-600 sm:col-span-2"
                  >
                    <Shield size={18} /> Process refund to buyer
                  </button>
                )}
              </div>

              {isDealClosed && (
                <div className="rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700 border border-emerald-200">
                  <CheckCircle size={14} className="inline-block mr-1" /> This deal is completed. Chat is read-only.
                </div>
              )}
            </div>

            {/* Message input */}
            {canChat && (
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 border-t border-slate-100 p-2 sm:gap-2 sm:p-3">
                <label className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-sky-50 hover:text-sky-600">
                  <Upload size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setChatImageFile(file);
                        setChatImagePreview(URL.createObjectURL(file));
                        handleSendChatImage(file);
                      }
                    }}
                  />
                </label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={tx.status === ESCROW_STATUS.DISPUTED ? "Type a message or upload evidence…" : "Type a message…"}
                  className="tk-input flex-1 !py-1.5 sm:!py-2"
                />
                <button type="submit" disabled={sending} className="tk-btn-primary !px-3 sm:!px-4">
                  <Send size={15} className="sm:h-4 sm:w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {profileModalUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setProfileModalUserId(null)}>
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-700">User Profile</h3>
              <button type="button" onClick={() => setProfileModalUserId(null)} className="rounded-full p-1 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            {profileModalLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
              </div>
            ) : !profileModalData ? (
              <p className="text-center text-sm text-slate-500">Profile not found.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    {profileModalData.photoURL ? (
                      <Image src={profileModalData.photoURL} alt="" width={64} height={64} className="rounded-full object-cover" unoptimized />
                    ) : (
                      <User size={32} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">{profileModalData.displayName || "User"}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {profileModalData.phoneVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-100">
                          <Smartphone size={10} /> Phone
                        </span>
                      )}
                      {profileModalData.emailVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 border border-sky-100">
                          <Mail size={10} /> Email
                        </span>
                      )}
                      {profileModalData.cnicVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                          <Shield size={10} /> CNIC
                        </span>
                      )}
                      {profileModalData.selfieVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                          <Camera size={10} /> Selfie
                        </span>
                      )}
                    </div>
                    {profileModalData.phone && (
                      <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <Phone size={12} /> {profileModalData.phone}
                      </p>
                    )}
                    {profileModalData.city && (
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={12} /> {profileModalData.city}
                      </p>
                    )}
                  </div>
                </div>
                {profileModalData.bio && <p className="text-sm text-slate-600">{profileModalData.bio}</p>}
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-1">
                    <Package size={12} /> Active ads ({profileModalAds.length})
                  </p>
                  {profileModalAds.length === 0 ? (
                    <p className="text-xs text-slate-400">No active ads.</p>
                  ) : (
                    <ul className="space-y-2">
                      {profileModalAds.slice(0, 5).map((a) => (
                        <li key={a.id}>
                          <Link href={`/ad/${a.id}`} onClick={() => setProfileModalUserId(null)} className="flex items-center gap-2 rounded-lg p-2 transition hover:bg-slate-50">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
                              <Image src={a.mainImage || a.images?.[0] || "/placeholder-ad.svg"} alt="" fill className="object-cover" unoptimized />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold">{a.title}</p>
                              <p className="text-[10px] text-cyan-700">{formatPrice(a.price)}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => { setZoomImageUrl(null); setZoomedIn(false); }}
        >
          <div className="relative flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={zoomImageUrl}
              alt="Zoomed"
              onClick={() => setZoomedIn((z) => !z)}
              className={`rounded-lg shadow-2xl transition-all duration-300 ${
                zoomedIn
                  ? "cursor-zoom-out max-h-none max-w-none sm:max-h-[95vh] sm:max-w-[95vw]"
                  : "cursor-zoom-in max-h-[75vh] max-w-[90vw] sm:max-h-[85vh] sm:max-w-[85vw]"
              }`}
            />
            <button
              type="button"
              onClick={() => { setZoomImageUrl(null); setZoomedIn(false); }}
              className="absolute -right-3 -top-3 rounded-full bg-white p-1.5 shadow-lg hover:bg-slate-100"
            >
              <X size={18} />
            </button>
            <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/70 hidden sm:block">
              Click image to {zoomedIn ? "shrink" : "zoom"}
            </p>
          </div>
        </div>
      )}

      {/* Deal Closed Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:h-20 sm:w-20">
              <CheckCircle size={36} className="sm:h-10 sm:w-10" />
            </div>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">Deal is closed successfully</h2>
            <p className="mt-2 text-sm text-slate-500">This escrow deal has been completed. Chat is now read-only.</p>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem(`deal_closed_modal_${id}`, "true");
                }
                setShowSuccessModal(false);
              }}
              className="tk-btn-primary mt-5 w-full"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Featured Ad Review Modal */}
      {showFeaturedReviewModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <Sparkles size={28} />
              </div>
              <h2 className="text-lg font-black text-slate-900 sm:text-xl">Your featured ad just sold!</h2>
              <p className="mt-1 text-sm text-slate-500">Share your experience to help other sellers discover the power of Featured Ads.</p>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">How was your experience?</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="I am very satisfied with the Featured Ad option..."
                  className="tk-input h-24 w-full resize-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`h-8 w-8 rounded-full text-lg transition ${star <= reviewRating ? "text-amber-400" : "text-slate-300"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem(`featured_review_${id}`, "skipped");
                  }
                  setShowFeaturedReviewModal(false);
                }}
                className="tk-btn-outline flex-1 text-xs"
              >
                Maybe later
              </button>
              <button
                type="button"
                disabled={!reviewText.trim() || reviewSubmitting}
                onClick={async () => {
                  setReviewSubmitting(true);
                  try {
                    await createFeaturedAdReview({
                      sellerId: user.uid,
                      sellerName: profile?.displayName || user.displayName || "Seller",
                      city: profile?.city || "Pakistan",
                      text: reviewText,
                      rating: reviewRating,
                    });
                    if (typeof window !== "undefined") {
                      localStorage.setItem(`featured_review_${id}`, "submitted");
                    }
                    setShowFeaturedReviewModal(false);
                    showToast("Thank you for your feedback!");
                  } catch {
                    showToast("Failed to submit review. Please try again.");
                  } finally {
                    setReviewSubmitting(false);
                  }
                }}
                className="tk-btn-primary flex-1 text-xs"
              >
                {reviewSubmitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
