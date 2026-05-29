"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PlusCircle, Bell, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeNotifications } from "@/lib/firestore-helpers";
import { cn } from "@/lib/utils";

const LINK_ITEMS = [
  { href: "/", icon: Home, label: "Home", match: (p) => p === "/" },
  { href: "/browse", icon: LayoutGrid, label: "Browse", match: (p) => p.startsWith("/browse") || p.startsWith("/category") },
  { href: "/post-ad", icon: PlusCircle, label: "Sell", accent: true, match: () => false },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(user.uid, (list) => {
      setUnreadCount(list.reduce((s, n) => s + (!n.read ? 1 : 0), 0));
    });
    return () => unsub();
  }, [user]);

  if (pathname.startsWith("/admin")) return null;

  const isNotificationsActive = pathname === "/notifications";
  const isAccountActive = pathname.startsWith("/dashboard");
  const notificationsLink = !user ? `/auth/login?redirect=${encodeURIComponent("/notifications")}` : "/notifications";
  const accountLink = !user ? `/auth/login?redirect=${encodeURIComponent("/dashboard")}` : "/dashboard";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[550] border-t border-slate-200/90 bg-white/98 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "max(0.35rem, var(--safe-bottom))" }}
    >
      <div className="flex items-stretch justify-around px-0.5 pt-2">
        {LINK_ITEMS.map(({ href, icon: Icon, label, accent, match }) => {
          const active = match(pathname);
          const loginHref = !user && (href === "/dashboard" || href === "/post-ad" || href.includes("purchases"));
          const link = loginHref ? `/auth/login?redirect=${encodeURIComponent(href)}` : href;

          return (
            <Link
              key={href}
              href={link}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-0.5",
                active ? "text-sky-700" : "text-slate-500"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl transition",
                  accent && "bg-gradient-to-br from-sky-500 to-cyan-700 text-white shadow-md shadow-sky-500/30",
                  active && !accent && "bg-sky-50"
                )}
              >
                <Icon size={accent ? 22 : 20} strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className={cn("text-[10px] font-bold leading-none", active && "text-sky-800")}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Notifications */}
        <Link
          href={notificationsLink}
          className={cn(
            "relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-0.5",
            isNotificationsActive ? "text-sky-700" : "text-slate-500"
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl transition",
              isNotificationsActive && "bg-sky-50"
            )}
          >
            <Bell size={20} strokeWidth={isNotificationsActive ? 2.5 : 2} />
          </span>
          {unreadCount > 0 && (
            <span className="absolute right-2 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className={cn("text-[10px] font-bold leading-none", isNotificationsActive && "text-sky-800")}>
            Notifications
          </span>
        </Link>

        {/* Account */}
        <Link
          href={accountLink}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-0.5",
            isAccountActive ? "text-sky-700" : "text-slate-500"
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl transition",
              isAccountActive && "bg-sky-50"
            )}
          >
            <User size={20} strokeWidth={isAccountActive ? 2.5 : 2} />
          </span>
          <span className={cn("text-[10px] font-bold leading-none", isAccountActive && "text-sky-800")}>
            Account
          </span>
        </Link>
      </div>
    </nav>
  );
}
