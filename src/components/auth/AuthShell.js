import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { Shield } from "lucide-react";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-[80vh] bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-700 text-lg font-black text-white shadow-lg shadow-sky-500/30">
              TK
            </span>
            <span className="mt-3 text-2xl font-black text-slate-900">{BRAND_NAME}</span>
          </Link>
          <h1 className="mt-6 text-xl font-black text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-600">{subtitle}</p>}
        </div>
        <div className="mt-8">{children}</div>
        <p className="mt-6 flex items-center justify-center gap-1 text-center text-xs text-slate-500">
          <Shield size={12} className="text-sky-600" />
          Escrow-protected marketplace for Pakistan
        </p>
      </div>
    </div>
  );
}
