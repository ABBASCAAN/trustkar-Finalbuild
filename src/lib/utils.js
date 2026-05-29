export function formatPrice(amount, currency = "PKR") {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatTimeAgo(timestampSeconds) {
  if (!timestampSeconds) return "";
  const now = Date.now();
  const then = timestampSeconds * 1000;
  const diff = now - then;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours >= 1) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes >= 1) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

export function getMemberSinceYears(timestampSeconds) {
  if (!timestampSeconds) return 0;
  const now = Date.now() / 1000;
  const diff = now - timestampSeconds;
  return Math.max(0, Math.floor(diff / (365 * 24 * 60 * 60)));
}

export function getConditionBadgeClass(condition) {
  switch (condition) {
    case "Brand New":
      return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
    case "Used":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    case "Broken/For Parts":
      return "bg-red-100 text-red-700 ring-1 ring-red-200";
    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
}

export function groupAdsByCategory(ads) {
  const groups = {};
  for (const ad of ads) {
    const key = ad.categoryId || "other";
    if (!groups[key]) {
      groups[key] = {
        id: key,
        title: ad.categoryName?.split(" › ")[0] || key,
        ads: [],
      };
    }
    groups[key].ads.push(ad);
  }
  return Object.values(groups);
}
