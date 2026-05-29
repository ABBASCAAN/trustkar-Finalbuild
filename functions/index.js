const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const ESCROW_STATUS = {
  FUNDS_HELD: "funds_held",
  DISPATCHED: "dispatched",
  INSPECTION: "inspection",
  PENDING_RELEASE: "pending_release",
  CANCELLED: "cancelled",
};

const DISPATCH_DEADLINE_HOURS = 72;
const INSPECTION_PERIOD_HOURS = 48;

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function computeDeadlineAction(tx, now = new Date()) {
  const nowMs = now.getTime();
  const dispatchDue = tx.dispatchDueAt?.toDate?.() ?? null;
  const inspectionEnd = tx.inspectionEndsAt?.toDate?.() ?? null;

  if (tx.status === ESCROW_STATUS.FUNDS_HELD && dispatchDue && nowMs > dispatchDue.getTime()) {
    return {
      action: "auto_cancel_no_ship",
      nextStatus: ESCROW_STATUS.CANCELLED,
      patch: {
        cancelledAt: Timestamp.fromDate(now),
        cancelReason: "Seller did not ship within the allowed timeframe.",
        autoProcessed: true,
      },
    };
  }

  if (tx.status === ESCROW_STATUS.INSPECTION && inspectionEnd && nowMs > inspectionEnd.getTime()) {
    return {
      action: "auto_complete_inspection",
      nextStatus: ESCROW_STATUS.PENDING_RELEASE,
      patch: {
        autoCompletedAt: Timestamp.fromDate(now),
        buyerVerifiedAt: tx.buyerVerifiedAt || Timestamp.fromDate(now),
        autoProcessed: true,
      },
    };
  }

  if (tx.status === ESCROW_STATUS.DISPATCHED && tx.shippedAt && !tx.inspectionStartedAt) {
    const shipped = tx.shippedAt?.toDate?.() ?? null;
    if (shipped && nowMs > shipped.getTime() + 60 * 1000) {
      const ends = addHours(now, INSPECTION_PERIOD_HOURS);
      return {
        action: "start_inspection",
        nextStatus: ESCROW_STATUS.INSPECTION,
        patch: {
          inspectionStartedAt: Timestamp.fromDate(now),
          inspectionEndsAt: Timestamp.fromDate(ends),
        },
      };
    }
  }

  return null;
}

async function processTx(docSnap) {
  const tx = { id: docSnap.id, ...docSnap.data() };
  if (tx.status === ESCROW_STATUS.DISPATCHED && tx.shippedAt && !tx.inspectionStartedAt) {
    const action = computeDeadlineAction(tx);
    if (action?.nextStatus) {
      await docSnap.ref.update({
        status: action.nextStatus,
        ...action.patch,
        updatedAt: Timestamp.now(),
      });
      return true;
    }
  }

  const action = computeDeadlineAction(tx);
  if (!action?.nextStatus) return false;

  await docSnap.ref.update({
    status: action.nextStatus,
    ...action.patch,
    updatedAt: Timestamp.now(),
  });
  return true;
}

exports.processEscrowDeadlines = onSchedule("every 15 minutes", async () => {
  const active = [
    ESCROW_STATUS.FUNDS_HELD,
    ESCROW_STATUS.DISPATCHED,
    ESCROW_STATUS.INSPECTION,
  ];

  let processed = 0;
  for (const status of active) {
    const snap = await db.collection("transactions").where("status", "==", status).limit(200).get();
    for (const docSnap of snap.docs) {
      const changed = await processTx(docSnap);
      if (changed) processed += 1;
    }
  }
  console.log(`Escrow deadlines processed: ${processed}`);
});
