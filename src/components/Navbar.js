"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BRAND_NAME } from "@/lib/constants";
import UserMenu from "@/components/UserMenu";
import { Plus, BadgeCheck, MessageCircle, LogIn, Store } from "lucide-react";
import NotificationsDropdown from "@/components/NotificationsDropdown";

export default function Navbar() {
  const { user, profile, isAdmin, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header
      className={`sticky top-0 z-[500] border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-shadow ${
        scrolled ? "shadow-md shadow-slate-200/30" : ""
      }`}
    >
      <div className="tk-container flex h-14 items-center justify-between gap-2 sm:h-[64px]">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-700 text-[11px] font-black text-white shadow-sm">
              TK
            </span>
            <span className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              {BRAND_NAME}
              <span className="ml-1 hidden text-[10px] font-bold text-sky-700 sm:inline">.pk</span>
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {user && (
              <Link
                href="/chats"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-sky-700 hover:shadow-md active:scale-95 sm:h-11 sm:w-11"
                title="Chats"
              >
                <MessageCircle size={18} className="transition-transform duration-300" />
              </Link>
            )}
            <NotificationsDropdown />
          </div>
        </div>

        {/* Right actions: Admin Panel → Sell → My Profile (left to right) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Admin Panel */}
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-sky-800 transition hover:bg-sky-100 sm:px-3 sm:py-2 sm:text-xs md:inline-flex"
            >
              <BadgeCheck size={13} className="sm:h-3.5 sm:w-3.5" /> Admin
            </Link>
          )}

          {/* My Store */}
          {profile?.accountType === "business" && profile?.storeSlug && (
            <Link
              href={`/store/${profile.storeSlug}`}
              className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100 sm:px-3 sm:py-2 sm:text-xs md:inline-flex"
            >
              <Store size={13} className="sm:h-3.5 sm:w-3.5" /> My Store
            </Link>
          )}

          {/* Sell */}
          <Link
            href="/post-ad"
            className="tk-btn-primary hidden !px-2.5 !py-1.5 text-[11px] md:inline-flex sm:!px-3 sm:!py-2 sm:text-xs"
          >
            <Plus size={14} className="sm:h-4 sm:w-4" /> Sell
          </Link>

          {/* My Profile */}
          {!loading && user ? (
            <UserMenu />
          ) : !loading ? (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-[11px] font-bold text-white shadow transition hover:bg-slate-800 active:scale-95 sm:px-4 sm:text-xs"
            >
              <LogIn size={13} className="sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Sign in</span>
              <span className="sm:hidden">Sign in</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
