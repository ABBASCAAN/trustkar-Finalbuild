import Link from "next/link";
import { Shield, Truck, Clock, Scale } from "lucide-react";

const ITEMS = [
  { icon: Shield, text: "Funds held in TrustKar escrow" },
  { icon: Truck, text: "Seller must ship with tracking" },
  { icon: Clock, text: "48h buyer inspection window" },
  { icon: Scale, text: "Dispute center if issues arise" },
];

export default function EscrowTrustStrip({ compact = false }) {
  return (
    <div
      className={`rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50/80 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {ITEMS.map(({ icon: Icon, text }) => (
          <p key={text} className="flex items-center gap-2 text-xs font-semibold text-sky-900">
            <Icon size={14} className="shrink-0 text-sky-600" />
            {text}
          </p>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        <Link href="/support#escrow-policy" className="font-bold text-sky-700 hover:underline">
          Read escrow policy
        </Link>
        {" · "}
        <Link href="/compare" className="font-bold text-sky-700 hover:underline">
          Why TrustKar?
        </Link>
      </p>
    </div>
  );
}
