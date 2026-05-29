import Link from "next/link";
import { Mail, Phone, Shield, Smartphone } from "lucide-react";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/constants";

const links = [
  { label: "Browse listings", href: "/browse" },
  { label: "Post an ad", href: "/post-ad" },
  { label: "My dashboard", href: "/dashboard" },
  { label: "Identity (KYC)", href: "/auth/kyc" },
  { label: "Why TrustKar?", href: "/compare" },
  { label: "Help & escrow policy", href: "/support" },
  { label: "Disputes", href: "/disputes" },
];

export default function Footer() {
  return (
    <footer className="mt-auto hidden border-t border-sky-200/60 bg-gradient-to-b from-slate-900 to-slate-950 text-white md:block">
      <div className="tk-container py-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-sky-400" />
              <span className="text-2xl font-black">{BRAND_NAME}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{BRAND_TAGLINE}</p>
            <Link
              href="/support"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2.5 text-sm font-bold text-sky-200 transition hover:bg-sky-500/20"
            >
              <Smartphone size={18} />
              Install as app (PWA guide)
            </Link>
          </div>

          <div>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-400">Quick links</h3>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/65 transition hover:text-sky-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-sm text-white/55">
            <p className="flex items-center gap-2">
              <Phone size={14} className="text-sky-400" /> +92 300 TRUSTKAR
            </p>
            <p className="mt-2 flex items-center gap-2">
              <Mail size={14} className="text-sky-400" /> help@trustkar.pk
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} {BRAND_NAME}. Pakistan 🇵🇰</p>
          <div className="flex gap-4 text-xs text-white/45">
            <Link href="/support#terms" className="hover:text-sky-300">
              Terms
            </Link>
            <Link href="/support#privacy" className="hover:text-sky-300">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
