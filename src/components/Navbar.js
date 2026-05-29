"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BRAND_NAME } from "@/lib/constants";
import UserMenu from "@/components/UserMenu";
import { Plus, X, BadgeCheck, Search, MessageCircle } from "lucide-react";
import NotificationsDropdown from "@/components/NotificationsDropdown";

export default function Navbar() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  function submitSearch() {
    if (!search.trim()) return;
    router.push(`/browse?search=${encodeURIComponent(search.trim())}`);
    setSearchOpen(false);
    setSearch("");
  }

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
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
                title="Chats"
              >
                <MessageCircle size={18} />
              </Link>
            )}
            <NotificationsDropdown />
          </div>
        </div>

        {/* Desktop search — hidden on homepage because HeroSearch is already there */}
        {pathname !== "/" && (
          <div className="mx-4 hidden max-w-md flex-1 items-center gap-2 md:flex">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Search listings…"
              className="tk-input !py-2 text-sm"
            />
            <button type="button" onClick={submitSearch} className="tk-btn-primary !px-3 !py-2">
              <Search size={16} />
            </button>
          </div>
        )}

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
              className="hidden rounded-full px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:block"
            >
              Login
            </Link>
          ) : null}

          {/* Mobile search toggle — hidden on homepage */}
          {pathname !== "/" && (
            <button
              type="button"
              className="rounded-lg p-2 transition hover:bg-slate-50 md:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile search bar — hidden on homepage */}
      {pathname !== "/" && (
        <div
          className={`overflow-hidden transition-all duration-300 md:hidden ${
            searchOpen ? "max-h-20 border-t border-slate-100" : "max-h-0"
          }`}
        >
          <div className="tk-container flex items-center gap-2 py-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Search listings…"
              className="tk-input !py-2 text-sm"
              autoFocus={searchOpen}
            />
            <button type="button" onClick={submitSearch} className="tk-btn-primary !px-3 !py-2">
              <Search size={16} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
