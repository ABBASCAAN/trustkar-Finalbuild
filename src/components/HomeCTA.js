import Link from "next/link";
import { Shield, PlusCircle, Search } from "lucide-react";

export default function HomeCTA() {
  return (
    <section className="tk-container py-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-cyan-600 to-blue-800 px-6 py-10 text-white shadow-xl shadow-sky-900/20 sm:px-12 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <Shield className="mx-auto h-12 w-12 text-sky-200" />
          <h2 className="mt-4 text-2xl font-black sm:text-3xl">Pakistan&apos;s safest way to buy & sell online</h2>
          <p className="mt-3 text-sm text-sky-100/90 sm:text-base">
            Every deal can use TrustKar escrow — pay to us, receive your item, then we release funds to the seller.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/browse" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-black text-blue-800 shadow-lg transition hover:bg-sky-50">
              <Search size={18} /> Browse all listings
            </Link>
            <Link href="/post-ad" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-white/10 px-8 py-3.5 text-sm font-black backdrop-blur transition hover:bg-white/20">
              <PlusCircle size={18} /> Post your ad free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
