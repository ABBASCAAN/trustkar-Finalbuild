"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, User, Settings, HelpCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const DROPDOWN_ITEMS = [
  { href: "/dashboard", label: "My Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/support", label: "Help and Support", icon: HelpCircle },
];

export default function UserMenu() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) return null;

  const name = profile?.displayName || user.displayName || user.email?.split("@")[0] || "Account";
  const photo = profile?.photoURL || user.photoURL;

  async function handleLogout() {
    await logout();
    setOpen(false);
    router.replace("/");
  }

  return (
    <div ref={ref} className="relative z-[650]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-bold text-slate-800 transition hover:border-cyan-300 hover:shadow-sm sm:px-3 sm:py-2"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-xs text-white sm:h-8 sm:w-8">
          {photo ? (
            <Image src={photo} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>
        <span className="hidden max-w-[80px] truncate sm:inline md:max-w-[100px]">{name}</span>
        <ChevronDown
          size={14}
          className={cn(
            "shrink-0 text-slate-500 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "absolute right-0 top-[calc(100%+10px)] z-[700] w-56 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200",
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-95 opacity-0"
        )}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-800">{name}</p>
          <p className="truncate text-[11px] text-slate-500">{user.email}</p>
        </div>

        {DROPDOWN_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-800"
          >
            <Icon size={16} className="text-sky-600" />
            {label}
          </Link>
        ))}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}
