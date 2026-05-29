import Link from "next/link";
import { Shield, Lock, Star, Scale, Truck, BadgeCheck, X, Check } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";

const ROWS = [
  { feature: "Escrow — funds held until delivery", trustkar: true, other: false },
  { feature: "48-hour inspection window", trustkar: true, other: false },
  { feature: "Built-in dispute center", trustkar: true, other: false },
  { feature: "Payment receipt verification", trustkar: true, other: false },
  { feature: "Seller reviews after real deals", trustkar: true, other: false },
  { feature: "Verified seller badges", trustkar: true, other: "partial" },
  { feature: "KYC for high-value sellers", trustkar: true, other: false },
  { feature: "Milestone payments (partial escrow)", trustkar: true, other: false },
  { feature: "Free to post ads", trustkar: true, other: true },
  { feature: "Category-specific listing forms", trustkar: true, other: false },
];

export const metadata = {
  title: `Why ${BRAND_NAME} — Compare with OLX-style sites`,
};

export default function ComparePage() {
  return (
    <div className="min-h-screen">
      <section className="bg-[var(--tk-hero)] px-4 py-14 text-center">
        <Scale className="mx-auto h-12 w-12 text-cyan-600" />
        <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl">
          Why {BRAND_NAME} beats ordinary classifieds
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          OLX-style sites connect buyers and sellers — but payment is on you. {BRAND_NAME} was built for
          Pakistan with escrow at the core: your money stays protected until you are satisfied.
        </p>
        <Link href="/" className="tk-btn-primary mt-8 inline-flex">
          Start buying safely
        </Link>
      </section>

      <section id="escrow" className="tk-container py-14">
        <h2 className="tk-section-title mb-8 text-center">Feature comparison</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="p-4 font-bold text-slate-700">Feature</th>
                <th className="p-4 font-bold text-cyan-700">{BRAND_NAME}</th>
                <th className="p-4 font-bold text-slate-500">Typical classifieds</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-slate-100">
                  <td className="p-4 font-medium text-slate-800">{row.feature}</td>
                  <td className="p-4">
                    {row.trustkar === true ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    {row.other === true ? (
                      <Check className="h-5 w-5 text-slate-400" />
                    ) : row.other === "partial" ? (
                      <span className="text-xs text-amber-600">Sometimes</span>
                    ) : (
                      <X className="h-5 w-5 text-red-400" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tk-container grid gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Shield, "Escrow first", "Every deal can run through protected payment flow."],
          [Lock, "No advance scams", "Seller does not get full payment until you verify."],
          [Star, "Real reviews", "Only buyers with completed trades can rate sellers."],
          [Truck, "Courier-friendly", "Categories chosen for items shippable nationwide."],
        ].map(([Icon, t, d]) => (
          <div key={t} className="tk-card !p-5">
            <Icon className="h-8 w-8 text-cyan-600" />
            <h3 className="mt-3 font-bold text-slate-900">{t}</h3>
            <p className="mt-2 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </section>

      <section className="tk-container pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-600 to-cyan-800 p-8 text-center text-white sm:p-12">
          <BadgeCheck className="mx-auto h-12 w-12" />
          <h2 className="mt-4 text-2xl font-black">Ready for safer buying?</h2>
          <p className="mx-auto mt-2 max-w-lg text-white/80">
            Join {BRAND_NAME} — post ads, buy with escrow, and build trust with verified reviews.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/auth/register" className="rounded-full bg-white px-6 py-3 font-bold text-cyan-800">
              Create account
            </Link>
            <Link href="/post-ad" className="rounded-full border border-white/40 px-6 py-3 font-bold text-white">
              Post an ad
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
