import { Shield, Lock, Users, Award } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";

const stats = [
  { icon: Lock, value: "100%", label: "Escrow Protected", color: "text-sky-700", bg: "bg-sky-50" },
  { icon: Shield, value: "48h", label: "Inspection Window", color: "text-cyan-700", bg: "bg-cyan-50" },
  { icon: Users, value: "KYC", label: "Verified Sellers", color: "text-blue-700", bg: "bg-blue-50" },
  { icon: Award, value: "#1", label: `${BRAND_NAME} Trust`, color: "text-amber-600", bg: "bg-amber-50" },
];

export default function TrustBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`shrink-0 rounded-lg p-2.5 ${stat.bg}`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-gray-900">{stat.value}</p>
              <p className="text-xs leading-tight text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
