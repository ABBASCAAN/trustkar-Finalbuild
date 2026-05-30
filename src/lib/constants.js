/** TRUSTKAR platform constants */

export const BRAND_NAME = "TrustKar";
export const BRAND_TAGLINE = "Pakistan's Escrow-Protected Marketplace";
export const INSPECTION_PERIOD_HOURS = 24;
export const DISPATCH_DEADLINE_HOURS = 72;
export const DISPUTE_RESPONSE_TIMEOUT_HOURS = 48;
export const ESCROW_FEE_PERCENT = 2.5;
export const NEW_ACCOUNT_TX_LIMIT_PKR = 100000;

export const ESCROW_STATUS = {
  DRAFT: "draft",
  PAYMENT_PENDING: "payment_pending",
  PENDING_VERIFICATION: "pending_verification",
  FUNDS_HELD: "funds_held",
  PENDING_SHIPMENT_VERIFY: "pending_shipment_verify",
  DISPATCHED: "dispatched",
  INSPECTION: "inspection",
  PENDING_RELEASE: "pending_release",
  RELEASED: "released",
  REJECTED: "rejected",
  RETURN_IN_TRANSIT: "return_in_transit",
  SELLER_REVIEW: "seller_review",
  REFUNDED: "refunded",
  DISPUTED: "disputed",
  CANCELLED: "cancelled",
};

export const ESCROW_STATUS_LABELS = {
  [ESCROW_STATUS.PAYMENT_PENDING]: "Awaiting payment",
  [ESCROW_STATUS.PENDING_VERIFICATION]: "Pending verification",
  [ESCROW_STATUS.FUNDS_HELD]: "Payment received — held at TrustKar",
  [ESCROW_STATUS.PENDING_SHIPMENT_VERIFY]: "Shipment awaiting verification",
  [ESCROW_STATUS.DISPATCHED]: "Item dispatched",
  [ESCROW_STATUS.INSPECTION]: "Inspection window",
  [ESCROW_STATUS.PENDING_RELEASE]: "Pending release to seller",
  [ESCROW_STATUS.RELEASED]: "Payment released to seller",
  [ESCROW_STATUS.REJECTED]: "Item rejected by buyer",
  [ESCROW_STATUS.RETURN_IN_TRANSIT]: "Return shipment in transit",
  [ESCROW_STATUS.SELLER_REVIEW]: "Seller reviewing return",
  [ESCROW_STATUS.REFUNDED]: "Refunded to buyer",
  [ESCROW_STATUS.DISPUTED]: "Disputed",
  [ESCROW_STATUS.CANCELLED]: "Cancelled",
};

export const BUYER_HELD_MESSAGE =
  "Payment Received and Safely Held At TrustKar Escrow";

export const PAYMENT_METHODS = [
  { id: "easypaisa", name: "EasyPaisa", icon: "wallet" },
  { id: "jazzcash", name: "JazzCash", icon: "wallet" },
  { id: "bank_transfer", name: "Bank Transfer", icon: "building" },
];

export const COLLECTIONS = {
  ADS: "ads",
  USERS: "users",
  TRANSACTIONS: "transactions",
  DISPUTES: "disputes",
  NOTIFICATIONS: "notifications",
  ADMIN_LOGS: "admin_logs",
  REVIEWS: "reviews",
  SUPPORT_TICKETS: "support_tickets",
  PLATFORM_SETTINGS: "platform_settings",
  INQUIRIES: "inquiries",
  SPONSORED_BANNERS: "sponsored_banners",
  ESCROW_LEDGER: "escrow_ledger",
  AUDIT_LOGS: "audit_logs",
  CHATS: "chats",
  FEATURED_AD_REVIEWS: "featured_ad_reviews",
  BUSINESSES: "businesses",
  SELLER_CATEGORIES: "seller_categories",
};

export const LEDGER_TYPES = {
  HOLD: "hold",
  FEE: "fee",
  RELEASE: "release",
  REFUND: "refund",
  PARTIAL_REFUND: "partial_refund",
};

export const DISPUTE_OUTCOMES = {
  FULL_REFUND: "full_refund",
  PARTIAL_REFUND: "partial_refund",
  RELEASE_SELLER: "release_seller",
};

export const BANNER_SLOTS = [
  { id: "hero", label: "Home — Hero banner" },
  { id: "featured_main", label: "Home — Featured Ads banner (big image)" },
  { id: "cta_primary", label: "Home — Primary CTA" },
  { id: "cta_secondary", label: "Home — Secondary slot" },
  { id: "sidebar", label: "Browse page — Sidebar" },
];

export const SORT_OPTIONS = [
  { id: "newest", label: "Newly listed" },
  { id: "views", label: "Most viewed" },
  { id: "price_asc", label: "Lowest price" },
  { id: "price_desc", label: "Highest price" },
];

export const USER_SUB = {
  WISHLIST: "wishlist",
  VIEWS: "views",
};

export const AD_STATUS = {
  ACTIVE: "active",
  PENDING_APPROVAL: "pending_approval",
  SOLD: "sold",
  DELETED: "deleted",
  INACTIVE: "inactive",
};

export const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Abbottabad",
  "Bahawalpur",
  "Sukkur",
];

export const CONDITIONS = ["Brand New", "Used", "Broken/For Parts"];

export const NOTIFICATION_TYPES = {
  CONTACT_SELLER: "contact_seller",
  SELLER_REPLY: "seller_reply",
  DEAL_CREATED: "deal_created",
  PAYMENT_SUBMITTED: "payment_submitted",
  PAYMENT_VERIFIED: "payment_verified",
  ITEM_RECEIVED: "item_received",
  PAYMENT_RELEASED: "payment_released",
  JOB_APPROVED: "job_approved",
  JOB_REJECTED: "job_rejected",
  FEATURED_AD: "featured_ad",
  SHIPMENT_POSTED: "shipment_posted",
  INSPECTION_STARTED: "inspection_started",
  DEAL_AUTO_COMPLETED: "deal_auto_completed",
  DEAL_CANCELLED: "deal_cancelled",
  DISPUTE_OPENED: "dispute_opened",
  PHONE_OTP_PENDING: "phone_otp_pending",
};
