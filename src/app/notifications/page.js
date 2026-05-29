"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/firestore-helpers";
import {
  TYPE_META,
  URGENCY_COLORS,
  URGENCY_ICONS,
} from "@/components/NotificationsDropdown";
import { ArrowLeft, Package, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  const unreadCount = notifications.reduce((s, n) => s + (!n.read ? 1 : 0), 0);

  async function handleMarkAllRead() {
    if (user) await markAllNotificationsRead(user.uid);
  }

  function handleClick(n) {
    if (!n.read) markNotificationRead(n.id);
    if (n.link) router.push(n.link);
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <Bell size={40} className="text-slate-300" />
        <p className="text-sm font-semibold text-slate-600">Please log in to view your notifications</p>
        <Link href="/auth/login" className="tk-btn-primary">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--tk-bg)] pb-24 md:pb-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="tk-container flex items-center gap-3 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-slate-100"
          >
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-slate-900">Notifications</h1>
            <p className="text-xs font-medium text-slate-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-full bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="tk-container py-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Package size={48} className="text-slate-300" />
            <p className="text-base font-bold text-slate-500">No notifications yet</p>
            <p className="max-w-xs text-sm text-slate-400">
              You will see escrow updates and marketplace alerts here as they happen
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                    <div className="flex items-start gap-4 px-4 py-4">
                      {hasImage ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200">
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
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border",
                            colors.bg,
                            colors.border
                          )}
                        >
                          <Icon size={20} className={colors.icon} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!n.read && (
                            <span className={cn("h-2 w-2 rounded-full", colors.dot)} />
                          )}
                          <p className="text-sm font-bold text-slate-800">
                            {n.title || meta.label}
                          </p>
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">
                          {n.body}
                        </p>
                        {n.link && (
                          <p className="mt-1.5 text-xs font-bold text-sky-700">
                            Open deal room &rarr;
                          </p>
                        )}
                        <p className="mt-1.5 text-[10px] text-slate-400">
                          {n.createdAt
                            ? new Date(n.createdAt.seconds * 1000).toLocaleDateString("en-PK", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
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
  );
}
