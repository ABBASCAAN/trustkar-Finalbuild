import {
  DISPATCH_DEADLINE_HOURS,
  ESCROW_FEE_PERCENT,
  ESCROW_STATUS,
  INSPECTION_PERIOD_HOURS,
  NEW_ACCOUNT_TX_LIMIT_PKR,
} from "./constants";

/** @returns {Date} */
export function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function calculateEscrowFees(amount, settings = {}) {
  const pct = settings.feePercent ?? ESCROW_FEE_PERCENT;
  const minFee = settings.minFee ?? 0;
  const rawFee = Math.round((Number(amount) || 0) * (pct / 100));
  const escrowFee = Math.max(rawFee, minFee);
  const sellerPayout = Math.max(0, (Number(amount) || 0) - escrowFee);
  return { escrowFee, sellerPayout, feePercent: pct };
}

export function isKycComplete(profile) {
  if (!profile) return false;
  return Boolean(profile.phoneVerified);
}

export function isFullKycComplete(profile) {
  if (!profile) return false;
  return Boolean(profile.phoneVerified);
}

export function getTxLimitForUser(profile) {
  const completed = profile?.completedDeals ?? 0;
  const trust = profile?.trustRating ?? 5;
  if (completed >= 5 || trust >= 4.5) return null;
  if (completed >= 1) return NEW_ACCOUNT_TX_LIMIT_PKR * 3;
  return NEW_ACCOUNT_TX_LIMIT_PKR;
}

export function requiresFullKyc(amountPkr) {
  return Number(amountPkr) > NEW_ACCOUNT_TX_LIMIT_PKR;
}

const LOCKED_STATUSES = [
  ESCROW_STATUS.DISPUTED,
  ESCROW_STATUS.RELEASED,
  ESCROW_STATUS.CANCELLED,
  ESCROW_STATUS.REFUNDED,
];

export function isFundsLocked(status) {
  return !LOCKED_STATUSES.includes(status);
}

/**
 * Validates whether a party may transition deal status.
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateTransition({ from, to, role, tx, extra = {} }) {
  if (from === to) return { ok: true };
  if (LOCKED_STATUSES.includes(from)) {
    return { ok: false, error: "This deal is closed." };
  }

  if (role === "admin") {
    return { ok: true };
  }

  const transitions = {
    [ESCROW_STATUS.PAYMENT_PENDING]: {
      [ESCROW_STATUS.PENDING_VERIFICATION]: ["buyer"],
    },
    [ESCROW_STATUS.FUNDS_HELD]: {
      [ESCROW_STATUS.PENDING_SHIPMENT_VERIFY]: ["seller"],
      [ESCROW_STATUS.DISPUTED]: ["buyer", "seller"],
    },
    [ESCROW_STATUS.PENDING_SHIPMENT_VERIFY]: {
      [ESCROW_STATUS.DISPATCHED]: ["admin"],
      [ESCROW_STATUS.DISPUTED]: ["buyer", "seller"],
    },
    [ESCROW_STATUS.DISPATCHED]: {
      [ESCROW_STATUS.INSPECTION]: ["system", "seller", "buyer", "admin"],
      [ESCROW_STATUS.DISPUTED]: ["buyer", "seller"],
    },
    [ESCROW_STATUS.INSPECTION]: {
      [ESCROW_STATUS.PENDING_RELEASE]: ["buyer"],
      [ESCROW_STATUS.DISPUTED]: ["buyer"],
    },
    [ESCROW_STATUS.PENDING_RELEASE]: {},
  };

  const allowed = transitions[from]?.[to];
  if (!allowed) {
    return { ok: false, error: `Cannot move from ${from} to ${to}.` };
  }
  if (!allowed.includes(role)) {
    return { ok: false, error: "You are not allowed to perform this action." };
  }

  if (to === ESCROW_STATUS.DISPATCHED) {
    if (!extra.trackingId?.trim()) {
      return { ok: false, error: "Tracking ID is required." };
    }
  }

  if (to === ESCROW_STATUS.DISPUTED && from === ESCROW_STATUS.PAYMENT_PENDING) {
    return { ok: false, error: "Pay and verify funds before disputing." };
  }

  return { ok: true };
}

/**
 * Deadline side-effects when opening deal page or cron runs.
 * @returns {{ action: string, nextStatus?: string, patch?: object } | null}
 */
export function computeDeadlineAction(tx, now = new Date()) {
  if (!tx?.status) return null;
  const nowMs = now.getTime();

  const dispatchDue = tx.dispatchDueAt?.toDate?.() ?? (tx.dispatchDueAt ? new Date(tx.dispatchDueAt) : null);
  const inspectionEnd =
    tx.inspectionEndsAt?.toDate?.() ?? (tx.inspectionEndsAt ? new Date(tx.inspectionEndsAt) : null);

  if (tx.status === ESCROW_STATUS.FUNDS_HELD && dispatchDue && nowMs > dispatchDue.getTime()) {
    return {
      action: "auto_cancel_no_ship",
      nextStatus: ESCROW_STATUS.CANCELLED,
      patch: {
        cancelledAt: now,
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
        autoCompletedAt: now,
        buyerVerifiedAt: tx.buyerVerifiedAt || now,
        autoProcessed: true,
      },
    };
  }

  return null;
}

export function formatDeadline(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
