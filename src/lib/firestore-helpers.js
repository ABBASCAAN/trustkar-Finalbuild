import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  writeBatch,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  COLLECTIONS,
  USER_SUB,
  ESCROW_STATUS,
  AD_STATUS,
  NOTIFICATION_TYPES,
  LEDGER_TYPES,
  DISPUTE_OUTCOMES,
  DISPATCH_DEADLINE_HOURS,
  INSPECTION_PERIOD_HOURS,
} from "./constants";
import { generateEscrowId } from "./escrow-id";
import { generateListingId } from "./listing-id";
import {
  addHours,
  calculateEscrowFees,
  computeDeadlineAction,
  getTxLimitForUser,
  isKycComplete,
  validateTransition,
} from "./escrow-engine";

export function subscribeActiveAds(callback, onError) {
  const q = query(
    collection(db, COLLECTIONS.ADS),
    where("status", "==", AD_STATUS.ACTIVE),
    limit(150)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => a.status === AD_STATUS.ACTIVE && a.disabled !== true)
        .sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
      callback(list);
    },
    (err) => {
      console.error("subscribeActiveAds:", err);
      if (onError) onError(err);
    }
  );
}

/** Trending score: views + recency + featured boost (no composite Firestore index needed). */
export function scoreTrendingAd(ad) {
  const views = Number(ad.viewCount || 0);
  const featuredBoost = ad.featured ? 12 : 0;
  const freshnessHours = ad.createdAt?.seconds
    ? Math.max(0, (Date.now() - ad.createdAt.seconds * 1000) / (1000 * 60 * 60))
    : 120;
  const freshnessBoost = Math.max(0, 20 - Math.min(20, freshnessHours / 6));
  return views + featuredBoost + freshnessBoost;
}

export function pickTrendingAds(ads, max = 10) {
  return [...ads]
    .map((ad) => ({ ...ad, __trend: scoreTrendingAd(ad) }))
    .sort((a, b) => b.__trend - a.__trend)
    .slice(0, max);
}

export function pickFeaturedAds(ads, max = 12) {
  return ads
    .filter((ad) => ad.featured === true)
    .sort((a, b) => {
      const fa = a.featuredAt?.seconds || a.createdAt?.seconds || 0;
      const fb = b.featuredAt?.seconds || b.createdAt?.seconds || 0;
      return fb - fa;
    })
    .slice(0, max);
}

const INACTIVE_AFTER_DAYS = 30;

async function maybeAutoInactive(ad) {
  if (!ad || ad.status !== AD_STATUS.ACTIVE || !ad.createdAt?.seconds) return ad;
  const ageDays = (Date.now() / 1000 - ad.createdAt.seconds) / 86400;
  if (ageDays >= INACTIVE_AFTER_DAYS) {
    await updateDoc(doc(db, COLLECTIONS.ADS, ad.id), { status: AD_STATUS.INACTIVE, updatedAt: serverTimestamp() });
    try {
      await createNotification({
        userId: ad.sellerId,
        type: "featured_ad",
        title: "Ad expired",
        body: `"${ad.title}" has expired after ${INACTIVE_AFTER_DAYS} days. Re-activate it from My Ads.`,
        link: `/ad/${ad.id}`,
        adId: ad.id,
      });
    } catch {}
    return { ...ad, status: AD_STATUS.INACTIVE };
  }
  return ad;
}

export async function fetchAds({ categoryId, max = 50 } = {}) {
  try {
    const q = query(
      collection(db, COLLECTIONS.ADS),
      where("status", "==", AD_STATUS.ACTIVE),
      orderBy("createdAt", "desc"),
      limit(max)
    );
    const snapshot = await getDocs(q);
    let list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (categoryId) list = list.filter((a) => a.categoryId === categoryId);
    return list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  } catch {
    const snapshot = await getDocs(
      query(collection(db, COLLECTIONS.ADS), where("status", "==", AD_STATUS.ACTIVE), limit(max))
    );
    let list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    if (categoryId) list = list.filter((a) => a.categoryId === categoryId);
    return list;
  }
}

export async function fetchAdById(adId, { viewerId } = {}) {
  const snap = await getDoc(doc(db, COLLECTIONS.ADS, adId));
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() };
  if (data.status === AD_STATUS.DELETED) return null;
  if (data.status === AD_STATUS.SOLD) return null;
  if (data.status === AD_STATUS.PENDING_APPROVAL) {
    if (viewerId && data.sellerId === viewerId) return data;
    return null;
  }
  const updated = await maybeAutoInactive(data);
  if (updated.status !== AD_STATUS.ACTIVE) {
    if (viewerId && updated.sellerId === viewerId) return updated;
    return null;
  }
  return updated;
}

export async function fetchAdByListingId(listingId) {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.ADS), where("listingId", "==", listingId), limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function createAd(adData, sellerId) {
  const listingId = generateListingId();
  const payload = {
    ...adData,
    sellerId,
    listingId,
    status: AD_STATUS.PENDING_APPROVAL,
    featured: false,
    featuredUntil: null,
    viewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  delete payload.milestoneEnabled;
  delete payload.upfrontPercent;
  delete payload.escrowVerified;
  const ref = await addDoc(collection(db, COLLECTIONS.ADS), payload);
  return { id: ref.id, listingId };
}

export async function updateAd(adId, data) {
  await updateDoc(doc(db, COLLECTIONS.ADS, adId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAd(adId) {
  await updateDoc(doc(db, COLLECTIONS.ADS, adId), {
    status: AD_STATUS.DELETED,
    updatedAt: serverTimestamp(),
  });
  await deleteNotificationsByAdId(adId);
}

export async function markAdSold(adId) {
  await updateDoc(doc(db, COLLECTIONS.ADS, adId), {
    status: AD_STATUS.SOLD,
    soldAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await deleteNotificationsByAdId(adId);
}

export async function approveAd(adId) {
  await updateAd(adId, { status: AD_STATUS.ACTIVE, approvedAt: serverTimestamp() });
}

export async function rejectAd(adId) {
  await updateAd(adId, { status: AD_STATUS.DELETED, rejectedAt: serverTimestamp() });
  await deleteNotificationsByAdId(adId);
}

export async function setAdFeatured(adId, { featured, featuredUntil, feeAmount } = {}) {
  await updateAd(adId, {
    featured: Boolean(featured),
    featuredUntil: featuredUntil || null,
    featuredFeePaid: feeAmount ?? null,
    featuredAt: featured ? serverTimestamp() : null,
  });
}

export async function fetchUserAds(sellerId) {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.ADS), where("sellerId", "==", sellerId), limit(100))
  );
  const ads = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) => a.status !== AD_STATUS.DELETED)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return Promise.all(ads.map((ad) => maybeAutoInactive(ad)));
}

export async function fetchPendingAds(max = 100) {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.ADS), where("status", "==", AD_STATUS.PENDING_APPROVAL), limit(max))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function getEscrowSettings() {
  const snap = await getDoc(doc(db, COLLECTIONS.PLATFORM_SETTINGS, "escrow"));
  if (!snap.exists()) return {};
  return snap.data();
}

export async function appendAuditLog({
  entityType,
  entityId,
  action,
  actorId,
  actorRole,
  meta = {},
}) {
  try {
    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      entityType,
      entityId,
      action,
      actorId: actorId || "system",
      actorRole: actorRole || "system",
      meta,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("audit log", e);
  }
}

export async function appendLedgerEntry({
  transactionId,
  escrowId,
  type,
  amount,
  userId,
  note,
}) {
  return addDoc(collection(db, COLLECTIONS.ESCROW_LEDGER), {
    transactionId,
    escrowId,
    type,
    amount: Number(amount) || 0,
    userId: userId || "",
    note: note || "",
    createdAt: serverTimestamp(),
  });
}

export async function assertBuyerCanTransact(buyerId, amount) {
  const profile = await fetchUserProfile(buyerId);
  if (!profile) throw new Error("Profile not found.");
  if (profile.suspended) throw new Error("Account suspended.");
  if (!isKycComplete(profile)) {
    throw new Error("Please verify your phone number before buying.");
  }
  const limit = getTxLimitForUser(profile);
  if (limit != null && Number(amount) > limit) {
    throw new Error(
      `New accounts are limited to PKR ${limit.toLocaleString()} per deal until trust score increases.`
    );
  }
  return profile;
}

export async function createTransaction({
  adId,
  buyerId,
  sellerId,
  amount,
  adTitle,
  buyerName,
  sellerName,
  buyerPhoto,
  sellerPhoto,
}) {
  await assertBuyerCanTransact(buyerId, amount);
  const settings = await getEscrowSettings();
  const { escrowFee, sellerPayout, feePercent } = calculateEscrowFees(amount, settings);
  const escrowId = generateEscrowId();
  const payload = {
    adId,
    buyerId,
    sellerId,
    amount: Number(amount),
    escrowFee,
    sellerPayout,
    feePercent,
    adTitle: adTitle || "",
    escrowId,
    status: ESCROW_STATUS.PAYMENT_PENDING,
    paymentProofText: null,
    paymentProofUrl: null,
    paymentMethod: null,
    fundsHeldAt: null,
    releasedAt: null,
    buyerVerifiedAt: null,
    dispatchDueAt: null,
    inspectionEndsAt: null,
    trackingId: null,
    courierName: null,
    shipmentProofUrl: null,
    shippedAt: null,
    inspectionStartedAt: null,
    chatArchived: false,
    buyerName: buyerName || "",
    sellerName: sellerName || "",
    buyerPhoto: buyerPhoto || "",
    sellerPhoto: sellerPhoto || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTIONS.TRANSACTIONS), payload);
  await appendAuditLog({
    entityType: "transaction",
    entityId: ref.id,
    action: "deal_created",
    actorId: buyerId,
    actorRole: "buyer",
    meta: { escrowId, amount, escrowFee },
  });
  await sendSystemMessage(ref.id, "Deal create ho gayi hai. Buyer total amount TrustKar Escrow Wallet (Easypaisa, JazzCash ya Bank Account) mein transfer kare aur payment proof ya Transaction ID submit kare.");
  await createNotification({
    userId: sellerId,
    type: NOTIFICATION_TYPES.DEAL_CREATED,
    title: "New escrow deal",
    body: `Buyer started escrow for ${adTitle || "your ad"}. Await payment.`,
    link: `/deal/${ref.id}`,
  });
  return { id: ref.id, escrowId, escrowFee, sellerPayout };
}

export async function fetchTransactionByEscrowId(escrowId) {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.TRANSACTIONS), where("escrowId", "==", escrowId), limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function fetchTransactionById(txId) {
  const snap = await getDoc(doc(db, COLLECTIONS.TRANSACTIONS, txId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateTransactionStatus(transactionId, status, extra = {}) {
  await updateDoc(doc(db, COLLECTIONS.TRANSACTIONS, transactionId), {
    status,
    ...extra,
    updatedAt: serverTimestamp(),
  });
}

export async function submitPaymentProof(transactionId, { text, imageUrl, method }) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");
  await updateTransactionStatus(transactionId, ESCROW_STATUS.PENDING_VERIFICATION, {
    paymentProofText: text || null,
    paymentProofUrl: imageUrl || null,
    paymentMethod: method || null,
    paymentSubmittedAt: serverTimestamp(),
  });
  await sendDealMessage(transactionId, {
    senderId: tx.buyerId,
    senderRole: "buyer",
    senderName: tx.buyerName || "Buyer",
    text: `Payment proof submitted via ${method || "unknown method"}${text ? ". TID: " + text : ""}. Awaiting TrustKar verification.`,
    imageUrl: imageUrl || null,
  });
  await sendSystemMessage(transactionId, "Buyer ne payment proof submit kar diya hai. Verification ke baad seller ko shipment instructions di jayengi.");
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.PAYMENT_SUBMITTED,
    title: "Buyer submitted payment proof",
    body: `Awaiting TrustKar verification for ${tx.adTitle || "your deal"}.`,
    link: `/deal/${transactionId}`,
  });
}

export async function adminVerifyPayment(transactionId, adminId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");
  const dispatchDue = addHours(new Date(), DISPATCH_DEADLINE_HOURS);
  await updateTransactionStatus(transactionId, ESCROW_STATUS.FUNDS_HELD, {
    fundsHeldAt: serverTimestamp(),
    verifiedByAdminAt: serverTimestamp(),
    dispatchDueAt: Timestamp.fromDate(dispatchDue),
  });
  await appendLedgerEntry({
    transactionId,
    escrowId: tx.escrowId,
    type: LEDGER_TYPES.HOLD,
    amount: tx.amount,
    userId: tx.buyerId,
    note: "Funds held in escrow",
  });
  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "payment_verified",
    actorId: adminId,
    actorRole: "admin",
    meta: { escrowId: tx.escrowId },
  });
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.PAYMENT_VERIFIED,
    title: "Payment verified",
    body: "Your payment is secured in TrustKar escrow.",
    link: `/deal/${transactionId}`,
  });
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.PAYMENT_VERIFIED,
    title: "Payment secured in escrow",
    body: `Buyer paid for ${tx.adTitle}. Ship within ${DISPATCH_DEADLINE_HOURS} hours.`,
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, `Payment verify kar di gayi hai. Funds TrustKar Escrow mein secure hain. Seller item dispatch kare aur courier details submit kare. Ship within ${DISPATCH_DEADLINE_HOURS} hours.`);
}

export async function sellerSubmitShipment(transactionId, sellerId, { trackingId, courierName, proofUrl }) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Deal not found");
  if (tx.sellerId !== sellerId) throw new Error("Only the seller can submit shipment.");
  const check = validateTransition({
    from: tx.status,
    to: ESCROW_STATUS.PENDING_SHIPMENT_VERIFY,
    role: "seller",
    tx,
    extra: { trackingId },
  });
  if (!check.ok) throw new Error(check.error);

  await updateTransactionStatus(transactionId, ESCROW_STATUS.PENDING_SHIPMENT_VERIFY, {
    trackingId: trackingId.trim(),
    courierName: (courierName || "").trim(),
    shipmentProofUrl: proofUrl || null,
    shippedAt: serverTimestamp(),
  });

  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "shipment_submitted",
    actorId: sellerId,
    actorRole: "seller",
    meta: { trackingId, courierName },
  });

  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.SHIPMENT_POSTED,
    title: "Shipment submitted",
    body: `Tracking: ${trackingId}. Awaiting TrustKar verification.`,
    link: `/deal/${transactionId}`,
  });
  await sendDealMessage(transactionId, {
    senderId: sellerId,
    senderRole: "seller",
    senderName: tx.sellerName || "Seller",
    text: `Shipment submitted${courierName ? " via " + courierName : ""}. Tracking: ${trackingId}. Awaiting admin verification.`,
    imageUrl: proofUrl || null,
  });
  await sendSystemMessage(transactionId, "Seller ne shipment details submit kar di hain. TrustKar Team verification kar rahi hai.");
}

export async function adminVerifyShipment(transactionId, adminId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");
  if (tx.status !== ESCROW_STATUS.PENDING_SHIPMENT_VERIFY) {
    throw new Error("Shipment is not pending verification.");
  }

  await updateTransactionStatus(transactionId, ESCROW_STATUS.DISPATCHED, {
    shipmentVerifiedByAdminAt: serverTimestamp(),
  });

  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "shipment_verified",
    actorId: adminId,
    actorRole: "admin",
    meta: { trackingId: tx.trackingId, courierName: tx.courierName },
  });

  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.SHIPMENT_POSTED,
    title: "Shipment verified",
    body: `Tracking: ${tx.trackingId}. Item is on the way — click 'Item received' once you get it.`,
    link: `/deal/${transactionId}`,
  });
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.SHIPMENT_POSTED,
    title: "Shipment verified",
    body: "Your shipment has been verified. Awaiting buyer confirmation.",
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, `Shipment verify kar di gayi hai. Buyer tracking details dekh sakta hai aur parcel receive hone ka intezar kare. Tracking: ${tx.trackingId}.`);
}

export async function startInspectionWindow(transactionId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx || tx.status !== ESCROW_STATUS.DISPATCHED) return;
  const now = new Date();
  const ends = addHours(now, INSPECTION_PERIOD_HOURS);
  await updateTransactionStatus(transactionId, ESCROW_STATUS.INSPECTION, {
    inspectionStartedAt: serverTimestamp(),
    inspectionEndsAt: Timestamp.fromDate(ends),
  });
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.INSPECTION_STARTED,
    title: "Inspection window open",
    body: `Accept the item or report an issue within ${INSPECTION_PERIOD_HOURS} hours.`,
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, `Inspection Period shuru ho gaya hai. Buyer ke paas item inspect karne ke liye ${INSPECTION_PERIOD_HOURS} ghante hain.`);
}

export async function buyerConfirmReceipt(transactionId, buyerId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Deal not found");
  if (tx.buyerId !== buyerId) throw new Error("Only the buyer can confirm receipt.");
  if (tx.status !== ESCROW_STATUS.DISPATCHED) {
    throw new Error("Item is not yet dispatched.");
  }
  await updateTransactionStatus(transactionId, ESCROW_STATUS.DISPATCHED, {
    buyerReceivedAt: serverTimestamp(),
  });
  await sendSystemMessage(transactionId, "Buyer ne item receive kar liya hai. Inspection Period shuru ho raha hai.");
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.ITEM_RECEIVED,
    title: "Buyer received item",
    body: "Buyer confirmed parcel received. Inspection period started.",
    link: `/deal/${transactionId}`,
  });
  await startInspectionWindow(transactionId);
}

export async function buyerAcceptItem(transactionId, buyerId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Deal not found");
  if (tx.buyerId !== buyerId) throw new Error("Only the buyer can accept.");
  const allowedStatuses = [
    ESCROW_STATUS.INSPECTION,
    ESCROW_STATUS.DISPATCHED,
    ESCROW_STATUS.FUNDS_HELD,
  ];
  if (!allowedStatuses.includes(tx.status)) {
    const check = validateTransition({
      from: tx.status,
      to: ESCROW_STATUS.PENDING_RELEASE,
      role: "buyer",
      tx,
    });
    if (!check.ok) throw new Error(check.error);
  }

  await updateTransactionStatus(transactionId, ESCROW_STATUS.PENDING_RELEASE, {
    buyerVerifiedAt: serverTimestamp(),
    acceptedAt: serverTimestamp(),
  });

  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "buyer_accepted",
    actorId: buyerId,
    actorRole: "buyer",
  });

  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.ITEM_RECEIVED,
    title: "Buyer accepted item",
    body: "Admin will release payment to you shortly.",
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, "Buyer ne item approve kar diya hai. TrustKar Team seller ko payment release kar rahi hai.");
}

/** @deprecated use buyerAcceptItem */
export async function buyerConfirmReceived(transactionId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Deal not found");
  return buyerAcceptItem(transactionId, tx.buyerId);
}

export async function adminReleaseToSeller(transactionId, adId, adminId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");
  if (tx.status === ESCROW_STATUS.DISPUTED) {
    throw new Error("Resolve the dispute before releasing funds.");
  }
  await updateTransactionStatus(transactionId, ESCROW_STATUS.RELEASED, {
    releasedAt: serverTimestamp(),
    chatArchived: true,
  });
  await appendLedgerEntry({
    transactionId,
    escrowId: tx.escrowId,
    type: LEDGER_TYPES.RELEASE,
    amount: tx.sellerPayout ?? tx.amount - (tx.escrowFee || 0),
    userId: tx.sellerId,
    note: "Released to seller",
  });
  if (tx.escrowFee) {
    await appendLedgerEntry({
      transactionId,
      escrowId: tx.escrowId,
      type: LEDGER_TYPES.FEE,
      amount: tx.escrowFee,
      userId: "platform",
      note: "Platform escrow fee",
    });
  }
  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "released_to_seller",
    actorId: adminId,
    actorRole: "admin",
  });
  await incrementCompletedDeal(tx.sellerId, tx.buyerId);
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.PAYMENT_RELEASED,
    title: "Payment released",
    body: `PKR ${(tx.sellerPayout ?? tx.amount).toLocaleString()} sent to you.`,
    link: `/deal/${transactionId}`,
  });
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.PAYMENT_RELEASED,
    title: "Transaction completed",
    body: `Your escrow deal is complete. Seller received the funds.`,
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, `Funds seller ko release kar diye gaye hain. Transaction successfully complete ho gayi hai. PKR ${(tx.sellerPayout ?? tx.amount).toLocaleString()} released to seller.`);
  if (adId) {
    await markAdSold(adId);
    const adSnap = await getDoc(doc(db, COLLECTIONS.ADS, adId));
    if (adSnap.exists() && adSnap.data().featured) {
      await incrementFeaturedAdSalesCount();
      await createNotification({
        userId: tx.sellerId,
        type: NOTIFICATION_TYPES.GENERAL,
        title: "Featured ad sold!",
        body: "Your featured ad just sold. Share your experience to help others.",
        link: `/deal/${transactionId}?reviewFeatured=1`,
      });
    }
  }
}

export async function processTransactionDeadlines(transactionId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) return null;

  const action = computeDeadlineAction(tx);
  if (!action?.nextStatus) return tx;

  const patch = { ...(action.patch || {}) };
  for (const key of ["cancelledAt", "autoCompletedAt", "buyerVerifiedAt", "inspectionStartedAt", "inspectionEndsAt", "sellerReviewedAt"]) {
    if (patch[key] instanceof Date) {
      patch[key] = Timestamp.fromDate(patch[key]);
    }
  }

  await updateTransactionStatus(transactionId, action.nextStatus, patch);

  if (action.action === "auto_cancel_no_ship") {
    await appendLedgerEntry({
      transactionId,
      escrowId: tx.escrowId,
      type: LEDGER_TYPES.REFUND,
      amount: tx.amount,
      userId: tx.buyerId,
      note: "Auto-refund: seller did not ship",
    });
    await createNotification({
      userId: tx.buyerId,
      type: NOTIFICATION_TYPES.DEAL_CANCELLED,
      title: "Deal cancelled — refund",
      body: "Seller did not ship in time. Contact support for refund processing.",
      link: `/deal/${transactionId}`,
    });
    await createNotification({
      userId: tx.sellerId,
      type: NOTIFICATION_TYPES.DEAL_CANCELLED,
      title: "Deal cancelled",
      body: "Shipment deadline missed.",
      link: `/deal/${transactionId}`,
    });
    await sendSystemMessage(transactionId, "Seller ne shipment deadline miss kar di. Buyer refund request raise kar sakta hai. TrustKar Team verify karke refund release kar sakti hai.");
  }

  if (action.action === "auto_complete_inspection") {
    await createNotification({
      userId: tx.buyerId,
      type: NOTIFICATION_TYPES.DEAL_AUTO_COMPLETED,
      title: "Inspection period ended",
      body: "Deal auto-completed. Admin will release seller payment.",
      link: `/deal/${transactionId}`,
    });
    await createNotification({
      userId: tx.sellerId,
      type: NOTIFICATION_TYPES.DEAL_AUTO_COMPLETED,
      title: "Buyer inspection window ended",
      body: "Payment pending admin release.",
      link: `/deal/${transactionId}`,
    });
    await sendSystemMessage(transactionId, "Inspection period complete ho gaya hai. Buyer ki taraf se koi dispute submit nahi hua. Funds seller ko release kiye ja rahe hain.");
  }

  if (action.action === "auto_accept_return_review") {
    await createNotification({
      userId: tx.buyerId,
      type: NOTIFICATION_TYPES.DEAL_AUTO_COMPLETED,
      title: "Return auto-accepted",
      body: "Seller did not review the returned item in time. Refund will be processed shortly.",
      link: `/deal/${transactionId}`,
    });
    await createNotification({
      userId: tx.sellerId,
      type: NOTIFICATION_TYPES.DEAL_AUTO_COMPLETED,
      title: "Return auto-accepted",
      body: "You did not review the returned item within the deadline. Refund is being processed.",
      link: `/deal/${transactionId}`,
    });
    await sendSystemMessage(transactionId, "Seller ne returned item ki review deadline miss kar di. System automatically accept kar raha hai. Refund process ki ja rahi hai.");
  }

  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: action.action,
    actorId: "system",
    actorRole: "system",
    meta: { nextStatus: action.nextStatus },
  });

  return fetchTransactionById(transactionId);
}

export async function raiseDealDispute(transactionId, userId, { reason, description, evidenceUrls = [] }) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");
  if (tx.buyerId !== userId && tx.sellerId !== userId) {
    throw new Error("Not a party to this deal.");
  }
  if ([ESCROW_STATUS.RELEASED, ESCROW_STATUS.CANCELLED].includes(tx.status)) {
    throw new Error("Cannot dispute a closed deal.");
  }

  const disputeRef = await addDoc(collection(db, COLLECTIONS.DISPUTES), {
    transactionId,
    buyerId: tx.buyerId,
    sellerId: tx.sellerId,
    raisedBy: userId,
    reason,
    description,
    evidenceUrls,
    status: "open",
    outcome: null,
    adminAssigned: false,
    responseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    createdAt: serverTimestamp(),
  });

  await updateTransactionStatus(transactionId, ESCROW_STATUS.DISPUTED, {
    disputeId: disputeRef.id,
  });

  await appendAuditLog({
    entityType: "dispute",
    entityId: disputeRef.id,
    action: "dispute_opened",
    actorId: userId,
    actorRole: userId === tx.buyerId ? "buyer" : "seller",
    meta: { transactionId },
  });

  const otherId = userId === tx.buyerId ? tx.sellerId : tx.buyerId;
  await createNotification({
    userId: otherId,
    type: NOTIFICATION_TYPES.DISPUTE_OPENED,
    title: "Dispute opened",
    body: reason,
    link: `/disputes/${disputeRef.id}`,
  });
  await sendSystemMessage(transactionId, `A dispute has been opened. Reason: ${reason}. Admin will review and resolve.`);

  // Send dispute evidence as chat messages so all parties can see them
  if (evidenceUrls?.length > 0) {
    for (const url of evidenceUrls) {
      await sendDealMessage(transactionId, {
        senderId: userId,
        senderRole: userId === tx.buyerId ? "buyer" : "seller",
        senderName: userId === tx.buyerId ? (tx.buyerName || "Buyer") : (tx.sellerName || "Seller"),
        text: "Dispute evidence attached",
        imageUrl: url,
      });
    }
  }

  return disputeRef.id;
}

export async function adminResolveDispute(disputeId, adminId, { outcome, partialAmount, note }) {
  const snap = await getDoc(doc(db, COLLECTIONS.DISPUTES, disputeId));
  if (!snap.exists()) throw new Error("Dispute not found");
  const dispute = { id: snap.id, ...snap.data() };
  const tx = await fetchTransactionById(dispute.transactionId);
  if (!tx) throw new Error("Transaction missing");

  await updateDoc(doc(db, COLLECTIONS.DISPUTES, disputeId), {
    status: "resolved",
    outcome,
    resolutionNote: note || "",
    partialAmount: partialAmount || null,
    resolvedAt: serverTimestamp(),
    resolvedBy: adminId,
  });

  if (outcome === DISPUTE_OUTCOMES.FULL_REFUND) {
    await updateTransactionStatus(dispute.transactionId, ESCROW_STATUS.CANCELLED, {
      cancelReason: note || "Dispute resolved: full refund",
      chatArchived: true,
    });
    await appendLedgerEntry({
      transactionId: dispute.transactionId,
      escrowId: tx.escrowId,
      type: LEDGER_TYPES.REFUND,
      amount: tx.amount,
      userId: tx.buyerId,
      note: "Full refund",
    });
  } else if (outcome === DISPUTE_OUTCOMES.PARTIAL_REFUND) {
    const refundAmt = Number(partialAmount) || 0;
    await updateTransactionStatus(dispute.transactionId, ESCROW_STATUS.PENDING_RELEASE, {
      partialRefundAmount: refundAmt,
      chatArchived: true,
    });
    await appendLedgerEntry({
      transactionId: dispute.transactionId,
      escrowId: tx.escrowId,
      type: LEDGER_TYPES.PARTIAL_REFUND,
      amount: refundAmt,
      userId: tx.buyerId,
      note: "Partial refund",
    });
  } else if (outcome === DISPUTE_OUTCOMES.RELEASE_SELLER) {
    await updateTransactionStatus(dispute.transactionId, ESCROW_STATUS.PENDING_RELEASE, {
      chatArchived: false,
    });
    await adminReleaseToSeller(dispute.transactionId, tx.adId, adminId);
  }

  await appendAuditLog({
    entityType: "dispute",
    entityId: disputeId,
    action: "dispute_resolved",
    actorId: adminId,
    actorRole: "admin",
    meta: { outcome },
  });

  await sendSystemMessage(dispute.transactionId, `Dispute resolved by TrustKar Team. Outcome: ${outcome}${note ? ". " + note : ""}.`);
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.DISPUTE_OPENED,
    title: "Dispute resolved",
    body: `Outcome: ${outcome}${note ? ". " + note : ""}.`,
    link: `/deal/${dispute.transactionId}`,
  });
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.DISPUTE_OPENED,
    title: "Dispute resolved",
    body: `Outcome: ${outcome}${note ? ". " + note : ""}.`,
    link: `/deal/${dispute.transactionId}`,
  });
}

export async function fetchOpenDisputes() {
  const q = query(
    collection(db, COLLECTIONS.DISPUTES),
    where("status", "==", "open"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Buyer rejects item during inspection — triggers return flow */
export async function buyerRejectItem(transactionId, buyerId, { reason, evidenceUrls = [] }) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Deal not found");
  if (tx.buyerId !== buyerId) throw new Error("Only buyer can reject.");
  const allowed = [ESCROW_STATUS.INSPECTION, ESCROW_STATUS.DISPATCHED, ESCROW_STATUS.PENDING_RELEASE];
  if (!allowed.includes(tx.status)) throw new Error("Cannot reject at this stage.");

  await updateTransactionStatus(transactionId, ESCROW_STATUS.REJECTED, {
    rejectedAt: serverTimestamp(),
    rejectionReason: reason || "",
    rejectionEvidenceUrls: evidenceUrls || [],
    returnDeadline: Timestamp.fromDate(addHours(new Date(), DISPATCH_DEADLINE_HOURS)),
  });

  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "buyer_rejected",
    actorId: buyerId,
    actorRole: "buyer",
    meta: { reason },
  });

  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.DISPUTE_OPENED,
    title: "Buyer rejected the item",
    body: `Reason: ${reason || "Not specified"}. Return process started.`,
    link: `/deal/${transactionId}`,
  });
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.DISPUTE_OPENED,
    title: "Dispute submitted",
    body: "Your rejection has been submitted. TrustKar Team will review your evidence shortly.",
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, `Buyer ne dispute submit kiya hai. TrustKar Team evidence review kar rahi hai. Reason: ${reason || "Not specified"}.`);

  // Send rejection evidence as chat messages so buyer, seller & TrustKar Team can all see them
  if (evidenceUrls?.length > 0) {
    for (const url of evidenceUrls) {
      await sendDealMessage(transactionId, {
        senderId: tx.buyerId,
        senderRole: "buyer",
        senderName: tx.buyerName || "Buyer",
        text: "Rejection evidence attached",
        imageUrl: url,
      });
    }
  }
}

/** Buyer submits return shipment proof */
export async function buyerSubmitReturnShipment(transactionId, buyerId, { trackingId, courierName, proofUrl }) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Deal not found");
  if (tx.buyerId !== buyerId) throw new Error("Only buyer can submit return shipment.");
  if (tx.status !== ESCROW_STATUS.REJECTED) throw new Error("Return shipment can only be submitted after rejection.");

  await updateTransactionStatus(transactionId, ESCROW_STATUS.RETURN_IN_TRANSIT, {
    returnTrackingId: trackingId?.trim() || "",
    returnCourierName: (courierName || "").trim(),
    returnShipmentProofUrl: proofUrl || null,
    returnShippedAt: serverTimestamp(),
  });

  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "return_shipped",
    actorId: buyerId,
    actorRole: "buyer",
    meta: { trackingId },
  });

  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.SHIPMENT_POSTED,
    title: "Return shipment submitted",
    body: `Tracking: ${trackingId}. Awaiting TrustKar verification.`,
    link: `/deal/${transactionId}`,
  });
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.SHIPMENT_POSTED,
    title: "Return shipment submitted",
    body: "Your return shipment has been submitted. Awaiting TrustKar verification.",
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, `Buyer ne return shipment submit kar di hai. Verification jari hai. Tracking: ${trackingId}.`);

  // Send return shipment proof as chat message so all parties can see it
  await sendDealMessage(transactionId, {
    senderId: tx.buyerId,
    senderRole: "buyer",
    senderName: tx.buyerName || "Buyer",
    text: `Return shipment submitted${courierName ? " via " + courierName : ""}. Tracking: ${trackingId}.`,
    imageUrl: proofUrl || null,
  });
}

/** TrustKar Team approves buyer's return request (Phase 8B) */
export async function adminApproveReturn(transactionId, adminId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");
  if (tx.status !== ESCROW_STATUS.REJECTED) throw new Error("Return is not pending approval.");
  if (tx.returnApprovedAt) throw new Error("Return already approved.");

  await updateTransactionStatus(transactionId, ESCROW_STATUS.REJECTED, {
    returnApprovedAt: serverTimestamp(),
    returnApprovedBy: adminId,
  });
  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "return_approved",
    actorId: adminId,
    actorRole: "admin",
  });
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.DISPUTE_OPENED,
    title: "Return request approved",
    body: "TrustKar approved your return. Ship the item back to seller within the deadline.",
    link: `/deal/${transactionId}`,
  });
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.DISPUTE_OPENED,
    title: "Return approved",
    body: "Buyer will ship the item back. Await the return shipment.",
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, "Return request approve kar di gayi hai. Buyer item seller ko wapas dispatch kare.");
}

/** TrustKar Team verifies buyer's return shipment (Phase 10B) */
export async function adminVerifyReturnShipment(transactionId, adminId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");
  if (tx.status !== ESCROW_STATUS.RETURN_IN_TRANSIT) throw new Error("Return is not in transit.");
  if (tx.returnShipmentVerifiedByAdminAt) throw new Error("Return shipment already verified.");

  const reviewDue = addHours(new Date(), INSPECTION_PERIOD_HOURS);
  await updateTransactionStatus(transactionId, ESCROW_STATUS.RETURN_IN_TRANSIT, {
    returnShipmentVerifiedByAdminAt: serverTimestamp(),
    returnReviewDueAt: Timestamp.fromDate(reviewDue),
  });
  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "return_shipment_verified",
    actorId: adminId,
    actorRole: "admin",
    meta: { trackingId: tx.returnTrackingId },
  });
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.SHIPMENT_POSTED,
    title: "Return shipment verified",
    body: "Your return shipment has been verified. Seller will review the returned item.",
    link: `/deal/${transactionId}`,
  });
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.SHIPMENT_POSTED,
    title: "Return shipment verified",
    body: `Tracking: ${tx.returnTrackingId}. Parcel is returning to you. Click 'Returned Item Received' once you get it.`,
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, `Return shipment verify kar di gayi hai. Seller parcel receive hone ka intezar kare. Tracking: ${tx.returnTrackingId}.`);
}

/** Seller confirms they received the returned parcel (Phase 11B) */
export async function sellerConfirmReturnReceipt(transactionId, sellerId) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Deal not found");
  if (tx.sellerId !== sellerId) throw new Error("Only seller can confirm receipt.");
  if (tx.status !== ESCROW_STATUS.RETURN_IN_TRANSIT) throw new Error("Item is not in return transit.");
  if (!tx.returnShipmentVerifiedByAdminAt) throw new Error("Return shipment is not yet verified by TrustKar.");
  if (tx.sellerReceivedReturnAt) throw new Error("Already confirmed receipt.");

  await updateTransactionStatus(transactionId, ESCROW_STATUS.RETURN_IN_TRANSIT, {
    sellerReceivedReturnAt: serverTimestamp(),
  });
  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "seller_received_return",
    actorId: sellerId,
    actorRole: "seller",
  });
  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.ITEM_RECEIVED,
    title: "Seller received return",
    body: "Seller confirmed they received the returned parcel. Inspection period started.",
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, "Seller ne returned parcel receive kar liya hai. Seller ke paas item inspect karne ke liye 24 ghante hain.");
}

/** Seller reviews returned item */
export async function sellerReviewReturn(transactionId, sellerId, { accept, note }) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Deal not found");
  if (tx.sellerId !== sellerId) throw new Error("Only seller can review return.");
  if (tx.status !== ESCROW_STATUS.RETURN_IN_TRANSIT) throw new Error("Item is not in return transit.");

  if (accept) {
    await updateTransactionStatus(transactionId, ESCROW_STATUS.SELLER_REVIEW, {
      sellerAcceptedReturn: true,
      sellerReviewNote: note || "",
      sellerReviewedAt: serverTimestamp(),
    });
    await appendAuditLog({
      entityType: "transaction",
      entityId: transactionId,
      action: "seller_accepted_return",
      actorId: sellerId,
      actorRole: "seller",
    });
    await createNotification({
      userId: tx.buyerId,
      type: NOTIFICATION_TYPES.ITEM_RECEIVED,
      title: "Seller accepted return",
      body: "Your refund will be processed shortly.",
      link: `/deal/${transactionId}`,
    });
    await sendSystemMessage(transactionId, "Seller ne confirm kar diya hai ke returned item satisfactory condition mein receive ho gaya hai. Refund process ki ja rahi hai.");
  } else {
    // Auto-create dispute record when seller rejects return
    const disputeRef = await addDoc(collection(db, COLLECTIONS.DISPUTES), {
      transactionId,
      buyerId: tx.buyerId,
      sellerId: tx.sellerId,
      raisedBy: sellerId,
      reason: "Seller rejected return",
      description: note || "Seller rejected the returned item.",
      evidenceUrls: [],
      rejectionEvidenceUrls: tx.rejectionEvidenceUrls || [],
      rejectionReason: tx.rejectionReason || "",
      status: "open",
      outcome: null,
      adminAssigned: false,
      responseDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt: serverTimestamp(),
    });

    await updateTransactionStatus(transactionId, ESCROW_STATUS.DISPUTED, {
      disputeId: disputeRef.id,
      sellerRejectedReturn: true,
      sellerReviewNote: note || "",
      sellerReviewedAt: serverTimestamp(),
    });

    await appendAuditLog({
      entityType: "dispute",
      entityId: disputeRef.id,
      action: "dispute_opened",
      actorId: sellerId,
      actorRole: "seller",
      meta: { transactionId, source: "return_rejection" },
    });

    await createNotification({
      userId: tx.buyerId,
      type: NOTIFICATION_TYPES.DISPUTE_OPENED,
      title: "Seller rejected return — dispute opened",
      body: "TrustKar will review the case.",
      link: `/disputes/${disputeRef.id}`,
    });

    await sendSystemMessage(transactionId, "Seller rejected the return. A dispute has been opened. TrustKar will review all evidence and resolve the case.");
  }
}

/** Send additional dispute evidence as chat messages visible to all parties (buyer, seller, admin) */
export async function sendDisputeEvidenceAsMessages(transactionId, userId, evidenceUrls = [], note = "Additional evidence") {
  if (!evidenceUrls?.length) return;
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");
  const role = userId === tx.buyerId ? "buyer" : userId === tx.sellerId ? "seller" : "admin";
  const name = role === "buyer" ? tx.buyerName || "Buyer" : role === "seller" ? tx.sellerName || "Seller" : "TrustKar Team";

  for (const url of evidenceUrls) {
    await sendDealMessage(transactionId, {
      senderId: userId,
      senderRole: role,
      senderName: name,
      text: note,
      imageUrl: url,
    });
  }
}

/** Soft-delete a chat message (admin only) */
export async function deleteChatMessage(transactionId, messageId, userId) {
  const msgRef = doc(db, COLLECTIONS.TRANSACTIONS, transactionId, "messages", messageId);
  const msgSnap = await getDoc(msgRef);
  if (!msgSnap.exists()) throw new Error("Message not found");
  const msg = msgSnap.data();
  if (msg.senderId !== userId && msg.senderRole !== "admin") throw new Error("You can only delete your own messages.");
  await updateDoc(msgRef, {
    deleted: true,
    deletedAt: serverTimestamp(),
    text: "This message was deleted.",
    imageUrl: null,
  });
}

/** Admin refunds buyer after seller accepted return or direct admin action */
export async function adminRefundBuyer(transactionId, adminId, { partialAmount, note } = {}) {
  const tx = await fetchTransactionById(transactionId);
  if (!tx) throw new Error("Transaction not found");

  const refundAmt = Number(partialAmount) || tx.amount;
  await updateTransactionStatus(transactionId, ESCROW_STATUS.REFUNDED, {
    refundedAt: serverTimestamp(),
    refundAmount: refundAmt,
    refundNote: note || "",
    refundedBy: adminId,
  });

  await appendLedgerEntry({
    transactionId,
    escrowId: tx.escrowId,
    type: LEDGER_TYPES.REFUND,
    amount: refundAmt,
    userId: tx.buyerId,
    note: note || "Refund to buyer",
  });

  await appendAuditLog({
    entityType: "transaction",
    entityId: transactionId,
    action: "refunded_to_buyer",
    actorId: adminId,
    actorRole: "admin",
    meta: { refundAmount: refundAmt },
  });

  await createNotification({
    userId: tx.buyerId,
    type: NOTIFICATION_TYPES.PAYMENT_RELEASED,
    title: "Refund processed",
    body: `PKR ${refundAmt.toLocaleString()} refunded to you.`,
    link: `/deal/${transactionId}`,
  });
  await createNotification({
    userId: tx.sellerId,
    type: NOTIFICATION_TYPES.DEAL_CANCELLED,
    title: "Deal refunded",
    body: "Buyer has been refunded.",
    link: `/deal/${transactionId}`,
  });
  await sendSystemMessage(transactionId, `Refund buyer ko successfully transfer kar diya gaya hai. Escrow fee deduct kar di gayi hai. Transaction close kar di gayi hai. PKR ${refundAmt.toLocaleString()} refunded.`);
}

/** Subscribe to a single transaction in real-time */
export function subscribeTransaction(transactionId, callback) {
  return onSnapshot(doc(db, COLLECTIONS.TRANSACTIONS, transactionId), (snap) => {
    if (!snap.exists()) return callback(null);
    callback({ id: snap.id, ...snap.data() });
  });
}

/** Admin fetches returns awaiting seller review */
export async function fetchPendingReturnReviews(max = 100) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where("status", "==", ESCROW_STATUS.SELLER_REVIEW),
      limit(max)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Admin fetches returns in transit */
export async function fetchReturnsInTransit(max = 100) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where("status", "==", ESCROW_STATUS.RETURN_IN_TRANSIT),
      limit(max)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Admin fetches rejected items awaiting buyer return shipment */
export async function fetchRejectedAwaitingReturn(max = 100) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where("status", "==", ESCROW_STATUS.REJECTED),
      limit(max)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Dispute negotiation chat */
export async function sendDisputeMessage(disputeId, { senderId, senderRole, senderName, text, imageUrl }) {
  const payload = {
    senderId,
    senderRole: senderRole || "buyer",
    senderName: senderName || "",
    text: (text || "").trim(),
    createdAt: serverTimestamp(),
  };
  if (imageUrl) payload.imageUrl = imageUrl;
  return addDoc(collection(db, COLLECTIONS.DISPUTES, disputeId, "messages"), payload);
}

export function subscribeDisputeMessages(disputeId, callback) {
  const q = query(
    collection(db, COLLECTIONS.DISPUTES, disputeId, "messages"),
    limit(500)
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    callback(list);
  });
}

export async function fetchDisputeById(disputeId) {
  const snap = await getDoc(doc(db, COLLECTIONS.DISPUTES, disputeId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function fetchUserTransactions(uid) {
  const [buyerSnap, sellerSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.TRANSACTIONS), where("buyerId", "==", uid))),
    getDocs(query(collection(db, COLLECTIONS.TRANSACTIONS), where("sellerId", "==", uid))),
  ]);
  const map = new Map();
  [...buyerSnap.docs, ...sellerSnap.docs].forEach((d) => {
    map.set(d.id, { id: d.id, ...d.data() });
  });
  return Array.from(map.values()).sort(
    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
  );
}

export async function fetchPendingVerifications(max = 100) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where("status", "==", ESCROW_STATUS.PENDING_VERIFICATION),
      limit(max)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchPendingShipmentVerifications(max = 100) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where("status", "==", ESCROW_STATUS.PENDING_SHIPMENT_VERIFY),
      limit(max)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchPendingReleases(max = 100) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.TRANSACTIONS),
      where("status", "==", ESCROW_STATUS.PENDING_RELEASE),
      limit(max)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Deal chat messages */
export async function sendDealMessage(transactionId, { senderId, senderRole, senderName, text, imageUrl }) {
  const payload = {
    senderId,
    senderRole,
    senderName: senderName || "",
    text: (text || "").trim(),
    createdAt: serverTimestamp(),
  };
  if (imageUrl) payload.imageUrl = imageUrl;
  return addDoc(collection(db, COLLECTIONS.TRANSACTIONS, transactionId, "messages"), payload);
}

export async function sendSystemMessage(transactionId, text) {
  return addDoc(collection(db, COLLECTIONS.TRANSACTIONS, transactionId, "messages"), {
    senderId: "system",
    senderRole: "admin",
    senderName: "TrustKar Team",
    text: (text || "").trim(),
    system: true,
    createdAt: serverTimestamp(),
  });
}

export function subscribeDealMessages(transactionId, callback) {
  const q = query(
    collection(db, COLLECTIONS.TRANSACTIONS, transactionId, "messages"),
    limit(500)
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    callback(list);
  });
}

/** Notifications */
export async function createNotification({ userId, type, title, body, link, meta = {}, adId = null }) {
  return addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
    userId,
    type,
    title,
    body,
    link: link || "",
    meta,
    adId: adId || null,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function deleteNotificationsByAdId(adId) {
  if (!adId) return;
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where("adId", "==", adId),
    limit(200)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function markAllNotificationsRead(userId) {
  if (!userId) return;
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where("userId", "==", userId),
    where("read", "==", false),
    limit(200)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

/** Phone OTP verification (admin sends OTP via WhatsApp manually) */
export async function generatePhoneOtp(userId, phoneNumber) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  await updateDoc(userRef, {
    phone: phoneNumber,
    phoneOtp: otp,
    phoneOtpExpiresAt: expiresAt,
    phoneVerified: false,
    otpRequestedAt: serverTimestamp(),
  });
  // Store in dedicated collection for admin dashboard (no composite index issues)
  await addDoc(collection(db, "phone_otp_requests"), {
    userId,
    phone: phoneNumber,
    otp,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return otp;
}

export async function verifyPhoneOtp(userId, otp) {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  if (!snap.exists()) throw new Error("User not found");
  const data = snap.data();
  if (!data.phoneOtp || data.phoneOtp !== otp) throw new Error("Invalid OTP");
  const now = Timestamp.now();
  const expires = data.phoneOtpExpiresAt;
  if (expires && expires.seconds < now.seconds) throw new Error("OTP expired");
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    phoneVerified: true,
    phoneOtp: null,
    phoneOtpExpiresAt: null,
    verifiedAt: serverTimestamp(),
  });
}

export async function fetchPendingOtpVerifications() {
  const q = query(
    collection(db, "phone_otp_requests"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((item) => item.status === "pending");
}

export async function markOtpSent(requestId) {
  await updateDoc(doc(db, "phone_otp_requests", requestId), {
    status: "sent",
    sentAt: serverTimestamp(),
  });
}

/** Profile / Settings */
export async function updateUserProfile(userId, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function savePaymentMethods(userId, methods) {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    paymentMethods: methods,
    updatedAt: serverTimestamp(),
  });
}

export async function uploadProfileImage(userId, file) {
  const { uploadImageToCloudinary } = await import("@/lib/cloudinary");
  const result = await uploadImageToCloudinary(file, { folder: "trustkar/profiles" });
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    photoURL: result.secureUrl,
    updatedAt: serverTimestamp(),
  });
  return result.secureUrl;
}

export function subscribeNotifications(userId, callback) {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where("userId", "==", userId),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(list);
    },
    () => callback([])
  );
}

export async function markNotificationRead(notifId) {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notifId), { read: true });
}

export async function getOrCreateInquiry({ adId, adTitle, sellerId, buyerId, buyerName, listingId }) {
  const existing = await getDocs(
    query(
      collection(db, COLLECTIONS.INQUIRIES),
      where("adId", "==", adId),
      where("buyerId", "==", buyerId),
      limit(3)
    )
  );
  const openDoc = existing.docs.find((d) => d.data().status === "open");
  if (openDoc) return openDoc.id;
  const inquiryRef = await addDoc(collection(db, COLLECTIONS.INQUIRIES), {
    adId,
    adTitle,
    listingId: listingId || "",
    sellerId,
    buyerId,
    buyerName: buyerName || "Buyer",
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return inquiryRef.id;
}

export async function notifyContactSeller({ adId, adTitle, sellerId, buyerId, buyerName, message, listingId }) {
  const inquiryId = await getOrCreateInquiry({
    adId,
    adTitle,
    sellerId,
    buyerId,
    buyerName,
    listingId,
  });
  const text = (message || "Hi, I'm interested in this item.").trim();
  await sendInquiryMessage(inquiryId, {
    senderId: buyerId,
    senderRole: "buyer",
    senderName: buyerName || "Buyer",
    text,
  });
  await createNotification({
    userId: sellerId,
    type: NOTIFICATION_TYPES.CONTACT_SELLER,
    title: "New buyer message",
    body: `${buyerName || "Buyer"}: ${text.slice(0, 80)}`,
    link: `/inquiry/${inquiryId}`,
    meta: { adId, inquiryId },
  });
  return inquiryId;
}

export async function sendInquiryMessage(inquiryId, { senderId, senderRole, senderName, text }) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;
  await addDoc(collection(db, COLLECTIONS.INQUIRIES, inquiryId, "messages"), {
    senderId,
    senderRole,
    senderName: senderName || senderRole,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, COLLECTIONS.INQUIRIES, inquiryId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const inq = await getDoc(doc(db, COLLECTIONS.INQUIRIES, inquiryId));
  if (!inq.exists()) return;
  const data = inq.data();
  if (senderRole === "admin") {
    for (const uid of [data.buyerId, data.sellerId]) {
      if (uid && uid !== senderId) {
        await createNotification({
          userId: uid,
          type: NOTIFICATION_TYPES.SELLER_REPLY,
          title: "Admin message on inquiry",
          body: trimmed.slice(0, 100),
          link: `/inquiry/${inquiryId}`,
          meta: { inquiryId },
        });
      }
    }
  } else {
    const notifyUser =
      senderRole === "buyer" ? data.sellerId : senderRole === "seller" ? data.buyerId : null;
    if (notifyUser && notifyUser !== senderId) {
      await createNotification({
        userId: notifyUser,
        type: NOTIFICATION_TYPES.SELLER_REPLY,
        title: "New inquiry message",
        body: trimmed.slice(0, 100),
        link: `/inquiry/${inquiryId}`,
        meta: { inquiryId },
      });
    }
  }
}

export function subscribeInquiryMessages(inquiryId, callback) {
  const q = query(collection(db, COLLECTIONS.INQUIRIES, inquiryId, "messages"), limit(300));
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    callback(list);
  });
}

export async function fetchInquiryById(inquiryId) {
  const snap = await getDoc(doc(db, COLLECTIONS.INQUIRIES, inquiryId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/** Sponsored / paid homepage banners */
export function subscribeSponsoredBanners(callback) {
  return onSnapshot(collection(db, COLLECTIONS.SPONSORED_BANNERS), (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((b) => b.active !== false)
      .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    callback(list);
  });
}

export async function fetchAllSponsoredBanners() {
  const snap = await getDocs(collection(db, COLLECTIONS.SPONSORED_BANNERS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createSponsoredBanner(data) {
  return addDoc(collection(db, COLLECTIONS.SPONSORED_BANNERS), {
    ...data,
    active: data.active !== false,
    createdAt: serverTimestamp(),
  });
}

export async function updateSponsoredBanner(id, data) {
  await updateDoc(doc(db, COLLECTIONS.SPONSORED_BANNERS, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSponsoredBanner(id) {
  await deleteDoc(doc(db, COLLECTIONS.SPONSORED_BANNERS, id));
}

/** Platform payment settings (admin) */
export async function getPaymentSettings() {
  const snap = await getDoc(doc(db, COLLECTIONS.PLATFORM_SETTINGS, "payment"));
  if (!snap.exists()) {
    return {
      easypaisa: { title: "EasyPaisa", number: "", accountName: "" },
      jazzcash: { title: "JazzCash", number: "", accountName: "" },
      bank_transfer: { title: "Bank Transfer", bankName: "", accountTitle: "", accountNumber: "", iban: "" },
    };
  }
  return snap.data();
}

export async function savePaymentSettings(data) {
  await setDoc(
    doc(db, COLLECTIONS.PLATFORM_SETTINGS, "payment"),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

const DEFAULT_HOMEPAGE_SETTINGS = {
  showPaidBanners: false,
  showGoogleAds: false,
  googleAdsClientId: "",
  googleAdSlotHero: "",
  googleAdSlotMid: "",
};

export async function getHomepageSettings() {
  const snap = await getDoc(doc(db, COLLECTIONS.PLATFORM_SETTINGS, "homepage"));
  if (!snap.exists()) return { ...DEFAULT_HOMEPAGE_SETTINGS };
  return { ...DEFAULT_HOMEPAGE_SETTINGS, ...snap.data() };
}

export function subscribeHomepageSettings(callback) {
  return onSnapshot(doc(db, COLLECTIONS.PLATFORM_SETTINGS, "homepage"), (snap) => {
    callback(snap.exists() ? { ...DEFAULT_HOMEPAGE_SETTINGS, ...snap.data() } : { ...DEFAULT_HOMEPAGE_SETTINGS });
  });
}

export async function saveHomepageSettings(data) {
  await setDoc(
    doc(db, COLLECTIONS.PLATFORM_SETTINGS, "homepage"),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export function derivePopularSearches(ads, max = 6) {
  const counts = {};
  for (const ad of ads) {
    const title = (ad.title || "").trim();
    if (!title) continue;
    const words = title.split(/\s+/).filter((w) => w.length > 2);
    const key = words.slice(0, 3).join(" ") || title.slice(0, 40);
    counts[key] = (counts[key] || 0) + 1;
  }
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([term]) => term);
  if (sorted.length >= 3) return sorted;
  return ads
    .slice(0, max)
    .map((a) => a.title?.split(/\s+/).slice(0, 2).join(" ") || a.title)
    .filter(Boolean);
}

export async function toggleWishlist(userId, adId, adMeta = {}) {
  const ref = doc(db, COLLECTIONS.USERS, userId, USER_SUB.WISHLIST, adId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, {
    adId,
    title: adMeta.title || "",
    price: adMeta.price || 0,
    mainImage: adMeta.mainImage || adMeta.images?.[0] || "",
    city: adMeta.city || "",
    addedAt: serverTimestamp(),
  });
  return true;
}

export async function isInWishlist(userId, adId) {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, userId, USER_SUB.WISHLIST, adId));
  return snap.exists();
}

export async function fetchWishlist(userId) {
  const snap = await getDocs(collection(db, COLLECTIONS.USERS, userId, USER_SUB.WISHLIST));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function recordAdView(userId, ad) {
  if (!ad?.id) return;
  try {
    await updateDoc(doc(db, COLLECTIONS.ADS, ad.id), { viewCount: increment(1) });
  } catch (_) {}
  if (!userId) return;
  await setDoc(
    doc(db, COLLECTIONS.USERS, userId, USER_SUB.VIEWS, ad.id),
    {
      adId: ad.id,
      title: ad.title || "",
      mainImage: ad.mainImage || ad.images?.[0] || "",
      price: ad.price || 0,
      city: ad.city || "",
      viewedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function fetchViewHistory(userId, max = 30) {
  const snap = await getDocs(collection(db, COLLECTIONS.USERS, userId, USER_SUB.VIEWS));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.viewedAt?.seconds || 0) - (a.viewedAt?.seconds || 0))
    .slice(0, max);
}

export async function createReview({
  buyerId,
  sellerId,
  transactionId,
  adId,
  rating,
  comment,
  buyerName,
}) {
  const ref = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
    buyerId,
    sellerId,
    transactionId,
    adId,
    rating: Math.min(5, Math.max(1, Number(rating))),
    comment: (comment || "").trim(),
    buyerName: buyerName || "Buyer",
    createdAt: serverTimestamp(),
  });
  await recalculateSellerRating(sellerId);
  return ref.id;
}

export async function fetchSellerReviews(sellerId, max = 50) {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.REVIEWS), where("sellerId", "==", sellerId), limit(max))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

async function recalculateSellerRating(sellerId) {
  const reviews = await fetchSellerReviews(sellerId, 100);
  if (!reviews.length) return;
  const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
  await updateDoc(doc(db, COLLECTIONS.USERS, sellerId), {
    trustRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
    updatedAt: serverTimestamp(),
  });
}

/** Featured Ad Reviews & Stats */
export async function createFeaturedAdReview({ sellerId, sellerName, city, text, rating }) {
  const ref = await addDoc(collection(db, COLLECTIONS.FEATURED_AD_REVIEWS), {
    sellerId,
    sellerName: (sellerName || "").trim() || "Seller",
    city: (city || "").trim() || "Pakistan",
    text: (text || "").trim(),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeFeaturedAdReviews(callback) {
  const q = query(
    collection(db, COLLECTIONS.FEATURED_AD_REVIEWS),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

export async function getFeaturedAdSalesCount() {
  const snap = await getDoc(doc(db, COLLECTIONS.PLATFORM_SETTINGS, "stats"));
  return snap.exists() ? snap.data()?.featuredAdSalesCount || 0 : 0;
}

export async function incrementFeaturedAdSalesCount() {
  await setDoc(
    doc(db, COLLECTIONS.PLATFORM_SETTINGS, "stats"),
    { featuredAdSalesCount: increment(1), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}

export async function createSupportTicket({ userId, email, subject, message, type }) {
  return addDoc(collection(db, COLLECTIONS.SUPPORT_TICKETS), {
    userId,
    email,
    subject,
    message,
    type: type || "general",
    status: "open",
    createdAt: serverTimestamp(),
  });
}

export async function logAdminAction(adminId, action, target = {}) {
  try {
    await addDoc(collection(db, COLLECTIONS.ADMIN_LOGS), {
      adminId,
      action,
      target,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("admin log", e);
  }
}

export async function adminUpdateUser(uid, data) {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function fetchAllUsers(max = 200) {
  const snap = await getDocs(query(collection(db, COLLECTIONS.USERS), limit(max)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function fetchAllAds(max = 200) {
  const snap = await getDocs(query(collection(db, COLLECTIONS.ADS), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAllTransactions(max = 200) {
  const snap = await getDocs(query(collection(db, COLLECTIONS.TRANSACTIONS), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function searchUserByEmailOrPhone(term) {
  const t = term.trim().toLowerCase();
  const users = await fetchAllUsers(500);
  return users.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(t) ||
      (u.phone || "").includes(term.trim()) ||
      (u.displayName || "").toLowerCase().includes(t)
  );
}

export function computePlatformStats(ads, users, transactions) {
  const cityCounts = {};
  for (const ad of ads) {
    if (ad.status !== AD_STATUS.ACTIVE) continue;
    const city = ad.city || ad.location || "Unknown";
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  }
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const held = transactions.filter((t) =>
    [ESCROW_STATUS.FUNDS_HELD, ESCROW_STATUS.PENDING_RELEASE, ESCROW_STATUS.PENDING_VERIFICATION].includes(
      t.status
    )
  );

  return {
    totalAds: ads.filter((a) => a.status === AD_STATUS.ACTIVE).length,
    pendingApprovals: ads.filter((a) => a.status === AD_STATUS.PENDING_APPROVAL).length,
    pendingVerification: transactions.filter((t) => t.status === ESCROW_STATUS.PENDING_VERIFICATION).length,
    pendingRelease: transactions.filter((t) => t.status === ESCROW_STATUS.PENDING_RELEASE).length,
    totalUsers: users.length,
    totalTransactions: transactions.length,
    escrowHeld: held.reduce((s, t) => s + (t.amount || 0), 0),
    activeDisputes: transactions.filter((t) => t.status === ESCROW_STATUS.DISPUTED).length,
    topCities,
    featuredAds: ads.filter((a) => a.featured).length,
  };
}

export async function incrementCompletedDeal(sellerId, buyerId) {
  const batch = writeBatch(db);
  batch.update(doc(db, COLLECTIONS.USERS, sellerId), { completedDeals: increment(1) });
  batch.update(doc(db, COLLECTIONS.USERS, buyerId), { completedDeals: increment(1) });
  await batch.commit();
}

/** Private buyer-seller chat */
export async function createOrGetChat({ adId, buyerId, sellerId, adTitle, adImage, adPrice, buyerName, sellerName }) {
  const q = query(
    collection(db, COLLECTIONS.CHATS),
    where("adId", "==", adId),
    where("buyerId", "==", buyerId),
    where("sellerId", "==", sellerId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  const ref = await addDoc(collection(db, COLLECTIONS.CHATS), {
    adId,
    buyerId,
    sellerId,
    adTitle: adTitle || "",
    adImage: adImage || "",
    adPrice: Number(adPrice) || 0,
    buyerName: buyerName || "",
    sellerName: sellerName || "",
    status: "active",
    agreedPrice: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const newSnap = await getDoc(ref);
  return { id: ref.id, ...newSnap.data() };
}

export async function sendChatMessage(chatId, { senderId, senderName, text, type = "text", offerAmount = null, imageUrl = null }) {
  await addDoc(collection(db, COLLECTIONS.CHATS, chatId, "messages"), {
    senderId,
    senderName: senderName || "",
    text: (text || "").trim(),
    type,
    offerAmount: offerAmount ?? null,
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp(),
  });
  // Update parent chat doc so global listeners can detect new messages without
  // subscribing to every messages subcollection.
  await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), {
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
    lastMessageText: (text || "").trim().slice(0, 200),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeChatMessages(chatId, callback) {
  const q = query(collection(db, COLLECTIONS.CHATS, chatId, "messages"), limit(500));
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    callback(list);
  });
}

export async function fetchUserChats(userId) {
  const [buyerSnap, sellerSnap] = await Promise.all([
    getDocs(query(collection(db, COLLECTIONS.CHATS), where("buyerId", "==", userId), limit(100))),
    getDocs(query(collection(db, COLLECTIONS.CHATS), where("sellerId", "==", userId), limit(100))),
  ]);
  const all = [...buyerSnap.docs, ...sellerSnap.docs]
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.updatedAt?.seconds || b.createdAt?.seconds || 0) - (a.updatedAt?.seconds || a.createdAt?.seconds || 0));
  const seen = new Set();
  return all.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

export function subscribeUserChats(userId, callback) {
  const qBuyer = query(collection(db, COLLECTIONS.CHATS), where("buyerId", "==", userId), limit(100));
  const qSeller = query(collection(db, COLLECTIONS.CHATS), where("sellerId", "==", userId), limit(100));

  let buyerDocs = [];
  let sellerDocs = [];

  function emit() {
    const map = new Map();
    for (const d of buyerDocs) map.set(d.id, { id: d.id, ...d.data() });
    for (const d of sellerDocs) map.set(d.id, { id: d.id, ...d.data() });
    const all = Array.from(map.values()).sort(
      (a, b) =>
        (b.lastMessageAt?.seconds || b.updatedAt?.seconds || b.createdAt?.seconds || 0) -
        (a.lastMessageAt?.seconds || a.updatedAt?.seconds || a.createdAt?.seconds || 0)
    );
    callback(all);
  }

  const unsubBuyer = onSnapshot(qBuyer, (snap) => {
    buyerDocs = snap.docs;
    emit();
  });
  const unsubSeller = onSnapshot(qSeller, (snap) => {
    sellerDocs = snap.docs;
    emit();
  });

  return () => {
    unsubBuyer();
    unsubSeller();
  };
}

export async function acceptChatOffer(chatId, agreedPrice) {
  await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), {
    agreedPrice: Number(agreedPrice) || null,
    status: "offer_accepted",
    updatedAt: serverTimestamp(),
  });
}

export async function closeChat(chatId) {
  await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), { status: "closed", updatedAt: serverTimestamp() });
}

export async function deleteChat(chatId) {
  const msgSnap = await getDocs(collection(db, COLLECTIONS.CHATS, chatId, "messages"));
  const batch = writeBatch(db);
  msgSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, COLLECTIONS.CHATS, chatId));
  await batch.commit();
}
