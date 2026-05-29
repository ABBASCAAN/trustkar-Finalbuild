import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { Smartphone, Shield } from "lucide-react";

export default function AppDownloadBanner() {
  return (
    <section className="tk-container py-10">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-10 text-center text-white sm:px-12">
        <Smartphone className="mx-auto h-12 w-12 text-cyan-400" />
        <h2 className="mt-4 text-2xl font-black">TrustKar App — Web2App Ready</h2>
        <p className="mx-auto mt-2 max-w-lg text-white/70">
          Install our PWA from Chrome/Safari today. Native Android & iOS apps coming soon — same account,
          same escrow wallet.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/auth/register" className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-bold text-white hover:bg-cyan-400">
            Get Started Free
          </Link>
          <Link href="/compare" className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold hover:bg-white/10">
            Why {BRAND_NAME}?
          </Link>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1 text-xs text-white/50">
          <Shield size={12} /> Escrow · Reviews · Disputes built-in
        </p>
      </div>
    </section>
  );
}
