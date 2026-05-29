"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, PlusCircle, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const LINK_ITEMS = [
  { href: "/", icon: Home, label: "Home", match: (p) => p === "/" },
  { href: "/browse", icon: LayoutGrid, label: "Browse", match: (p) => p.startsWith("/browse") || p.startsWith("/category") },
  { href: "/post-ad", icon: PlusCircle, label: "Sell", accent: true, match: () => false },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname.startsWith("/admin")) return null;

  const isChatsActive = pathname.startsWith("/chats") || pathname.startsWith("/chat");
  const isAccountActive = pathname.startsWith("/dashboard");
  const chatsLink = !user ? `/auth/login?redirect=${encodeURIComponent("/chats")}` : "/chats";
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

        {/* Chats */}
        <Link
          href={chatsLink}
          className={cn(
            "relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-0.5",
            isChatsActive ? "text-sky-700" : "text-slate-500"
          )}
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl transition",
              isChatsActive && "bg-sky-50"
            )}
          >
            <MessageCircle size={20} strokeWidth={isChatsActive ? 2.5 : 2} />
          </span>
          <span className={cn("text-[10px] font-bold leading-none", isChatsActive && "text-sky-800")}>
            Chats
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
