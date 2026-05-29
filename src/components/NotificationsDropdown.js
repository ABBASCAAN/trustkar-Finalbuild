"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { subscribeNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/firestore-helpers";
import { Bell, AlertTriangle, CheckCircle, Info, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const TYPE_META = {
  payment_verified: { urgency: "success", label: "Payment" },
  shipment_posted: { urgency: "info", label: "Shipment" },
  item_received: { urgency: "success", label: "Received" },
  inspection_started: { urgency: "warning", label: "Inspection" },
  payment_released: { urgency: "success", label: "Completed" },
  deal_auto_completed: { urgency: "success", label: "Completed" },
  deal_cancelled: { urgency: "urgent", label: "Cancelled" },
  dispute_opened: { urgency: "urgent", label: "Dispute" },
  featured_ad: { urgency: "info", label: "Featured" },
  contact_seller: { urgency: "info", label: "Inquiry" },
  seller_reply: { urgency: "info", label: "Reply" },
  job_approved: { urgency: "success", label: "Approved" },
  job_rejected: { urgency: "urgent", label: "Rejected" },
};

export const URGENCY_COLORS = {
  urgent: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-600",
    badge: "bg-red-500",
    dot: "bg-red-500",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    badge: "bg-amber-500",
    dot: "bg-amber-500",
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    badge: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  info: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    icon: "text-sky-600",
    badge: "bg-sky-500",
    dot: "bg-sky-500",
  },
};

export const URGENCY_ICONS = {
  urgent: AlertTriangle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

export default function NotificationsDropdown({
  placement = "bottom-left",
  className,
  triggerClassName,
  label,
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) return null;

  const unreadCount = notifications.reduce((s, n) => s + (!n.read ? 1 : 0), 0);

  function handleClick(n) {
    if (!n.read) markNotificationRead(n.id);
    setOpen(false);
  }

  const isTop = placement.startsWith("top");
  const isRight = placement.endsWith("right");

  const triggerBase =
    "relative flex items-center justify-center transition active:scale-95";
  const triggerDefault =
    "h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-cyan-300 hover:text-sky-700 hover:shadow-md sm:h-11 sm:w-11";

  const dropdownBase =
    "absolute z-[700] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 w-[320px] sm:w-[380px]";
  const dropdownPosition = isTop
    ? isRight
      ? "bottom-[calc(100%+10px)] right-0 origin-bottom-right"
      : "bottom-[calc(100%+10px)] left-0 origin-bottom-left"
    : isRight
      ? "top-[calc(100%+10px)] right-0 origin-top-right"
      : "top-[calc(100%+10px)] left-0 origin-top-left";
  const dropdownAnim = open
    ? "translate-y-0 scale-100 opacity-100"
    : isTop
      ? "pointer-events-none translate-y-2 scale-95 opacity-0"
      : "pointer-events-none -translate-y-2 scale-95 opacity-0";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(triggerBase, !triggerClassName && triggerDefault, triggerClassName)}
      >
        <Bell
          size={18}
          className={cn(
            "transition-transform duration-300",
            unreadCount > 0 && "animate-[swing_2s_ease-in-out_infinite]"
          )}
        />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {label && <span className="text-[9px] font-bold leading-none">{label}</span>}
      </button>

      <div className={cn(dropdownBase, dropdownPosition, dropdownAnim)}>
        {/* Mobile overlay backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-[-1] bg-black/20 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-[11px] font-medium text-slate-500">{unreadCount} unread</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={async () => {
                  if (user) await markAllNotificationsRead(user.uid);
                }}
                className="rounded-lg px-2 py-1 text-[11px] font-bold text-sky-700 transition hover:bg-sky-50"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <Package size={28} className="text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
              <p className="text-xs text-slate-400">You will see escrow updates here</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] || { urgency: "info", label: "Notification" };
                const colors = URGENCY_COLORS[meta.urgency];
                const Icon = URGENCY_ICONS[meta.urgency];
                const hasImage = n.imageUrl || n.thumbnailUrl;
                const Wrapper = n.link ? Link : "div";
                const wrapperProps = n.link
                  ? { href: n.link, onClick: () => handleClick(n), className: "block" }
                  : { onClick: () => handleClick(n), className: "block cursor-pointer" };

                return (
                  <li
                    key={n.id}
                    className={cn(
                      "transition-colors duration-500 hover:bg-slate-50",
                      !n.read && `${colors.bg} border-l-4 ${colors.border.replace("border-", "border-l-")}`
                    )}
                  >
                    <Wrapper {...wrapperProps}>
                      <div className="flex items-start gap-3 px-4 py-3">
                        {hasImage ? (
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                            <Image
                              src={n.imageUrl || n.thumbnailUrl}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                              colors.bg,
                              colors.border
                            )}
                          >
                            <Icon size={18} className={colors.icon} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {!n.read && (
                              <span className={cn("h-1.5 w-1.5 rounded-full", colors.dot)} />
                            )}
                            <p className="truncate text-xs font-bold text-slate-800">
                              {n.title || meta.label}
                            </p>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 line-clamp-2">
                            {n.body}
                          </p>
                          {n.link && (
                            <p className="mt-1 text-[10px] font-bold text-sky-700">
                              Open deal room &rarr;
                            </p>
                          )}
                        </div>
                      </div>
                    </Wrapper>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
