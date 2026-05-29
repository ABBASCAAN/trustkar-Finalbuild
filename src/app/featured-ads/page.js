"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getFeaturedAdSalesCount,
  subscribeFeaturedAdReviews,
} from "@/lib/firestore-helpers";
import {
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Megaphone,
  Star,
  Users,
  Rocket,
  Lock,
  CheckCircle2,
  Phone,
} from "lucide-react";

const STATIC_STATS = [
  { value: "5x", label: "More views", sub: "on average" },
  { value: "72h", label: "Avg. sell time", sub: "for featured" },
  { value: "100%", label: "Escrow safe", sub: "every transaction" },
];

const FEATURED_BENEFITS = [
  {
    icon: TrendingUp,
    title: "Top Placement",
    desc: "Your ad appears at the very top of search results and category pages — right where buyers look first. You are not lost in the crowd.",
  },
  {
    icon: Eye,
    title: "Up to 5x More Views",
    desc: "Featured ads get significantly more eyeballs. More views mean faster sales and better prices. Visibility is everything online.",
  },
  {
    icon: Zap,
    title: "Sell in 72 Hours",
    desc: "Most featured ads sell within the first 3 days. Skip the waiting and close deals quickly while your item is still fresh.",
  },
  {
    icon: Shield,
    title: "Escrow Protected",
    desc: "Every featured ad still enjoys full escrow protection. Buyers trust verified, highlighted listings far more than regular ones.",
  },
  {
    icon: Clock,
    title: "Flexible Duration",
    desc: "Choose how long you want the spotlight — 3, 7, 14, or 30 days. Extend anytime if you want to keep the momentum going.",
  },
  {
    icon: BadgeCheck,
    title: "Gold Verified Badge",
    desc: "Featured ads carry a special gold spark badge that signals quality and trust to every shopper scrolling past.",
  },
];

const PRICING_PLANS = [
  { days: 3, price: 499, perDay: 166, popular: false, save: null },
  { days: 7, price: 999, perDay: 143, popular: true, save: "Save 14%" },
  { days: 14, price: 1799, perDay: 129, popular: false, save: "Save 22%" },
  { days: 30, price: 2999, perDay: 100, popular: false, save: "Save 40%" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Post your ad",
    desc: "Create a normal listing with great photos and a clear description. Set a fair price and choose the right category.",
  },
  {
    step: "02",
    title: "Choose Featured",
    desc: "Go to Dashboard → My Ads and click \"Feature this ad\". Pick a plan that fits your budget and selling timeline.",
  },
  {
    step: "03",
    title: "Pay & Go Live",
    desc: "Pay via EasyPaisa, JazzCash, or Bank Transfer. Your ad is boosted to the top within minutes of confirmation.",
  },
  {
    step: "04",
    title: "Sell Securely",
    desc: "Buyers contact you fast. Use TrustKar Escrow so both sides stay safe from first message to final payment.",
  },
];

const DEFAULT_TESTIMONIALS = [
  {
    name: "Ahmed R.",
    city: "Lahore",
    text: "I featured my iPhone ad for 7 days. It got 4x more views than my previous listing and sold in 2 days. Worth every rupee.",
    rating: 5,
  },
  {
    name: "Sana K.",
    city: "Karachi",
    text: "As a small shop owner, featured ads helped me clear old inventory in under a week. The gold badge makes buyers trust you instantly.",
    rating: 5,
  },
  {
    name: "Bilal M.",
    city: "Islamabad",
    text: "I was skeptical at first, but the 3-day plan paid for itself. My gaming laptop sold on day 1. Will definitely use again.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "Will my ad really sell faster?",
    a: "Yes. Featured ads get top placement and a bright badge, which builds instant buyer trust. Most sellers report their featured ads sell within 1–3 days. The extra visibility directly translates into more inquiries and faster deals.",
  },
  {
    q: "Is the fee a one-time payment?",
    a: "Absolutely. You pay once for the duration you choose. There are no hidden charges, no subscription traps, and no automatic renewals. Your card or wallet is never charged again unless you manually choose to extend.",
  },
  {
    q: "Can I feature an ad that is already live?",
    a: "Yes. Go to Dashboard → My Ads, find your listing, and click \"Feature this ad\". It will be boosted immediately after payment confirmation. You do not need to create a new listing.",
  },
  {
    q: "What happens when the featured period ends?",
    a: "Your ad simply returns to its normal position in search results. It stays fully live and functional until you remove it or it auto-expires after 30 days of inactivity. You can re-feature it anytime.",
  },
  {
    q: "Do featured ads get any special support?",
    a: "All ads on TrustKar enjoy the same world-class escrow protection and support. Featured ads simply get more visibility — there is no separate support tier. Every seller gets equal treatment.",
  },
  {
    q: "What if my item does not sell during the featured period?",
    a: "While most featured ads sell quickly, we recommend double-checking your price and photos if yours does not. A competitive price and clear images make the biggest difference. You can always re-feature after adjusting.",
  },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white transition hover:border-sky-200">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left sm:px-6 sm:py-4"
      >
        <span className="pr-3 text-sm font-bold text-slate-900 sm:text-base">{q}</span>
        {open ? (
          <ChevronUp size={18} className="shrink-0 text-sky-600" />
        ) : (
          <ChevronDown size={18} className="shrink-0 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed text-slate-600 sm:px-6 sm:pb-5 sm:text-[15px]">
          {a}
        </div>
      )}
    </div>
  );
}

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export default function FeaturedAdsPage() {
  const [salesCount, setSalesCount] = useState(0);
  const [testimonials, setTestimonials] = useState(DEFAULT_TESTIMONIALS);

  useEffect(() => {
    getFeaturedAdSalesCount().then(setSalesCount).catch(() => setSalesCount(0));
  }, []);

  useEffect(() => {
    const unsub = subscribeFeaturedAdReviews((list) => {
      if (list.length > 0) {
        setTestimonials(
          list.map((r) => ({
            name: r.sellerName || "Seller",
            city: r.city || "Pakistan",
            text: r.text || "",
            rating: r.rating || 5,
          }))
        );
      }
    });
    return () => unsub();
  }, []);

  const stats = [
    ...STATIC_STATS.slice(0, 2),
    { value: String(salesCount), label: "Happy sellers", sub: "across Pakistan" },
    STATIC_STATS[2],
  ];

  return (
    <div className="min-h-screen bg-[var(--tk-bg)] pb-20">
      {/* HERO */}
      <div className="tk-container pt-5 sm:pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#053a78] via-[#0a5cad] to-[#0ea5e9] px-5 py-10 text-white shadow-2xl shadow-sky-900/25 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-12 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm sm:text-xs">
              <Sparkles size={14} />
              Stand out from the crowd
            </span>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              Get Your Ad Seen.<br className="hidden sm:block" />
              <span className="text-sky-200"> Sell Faster.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-sky-100/90 sm:text-base lg:text-lg">
              TrustKar Featured Ads put your listing at the top of every search and category page.
              More views, more trust, and a secure escrow-backed sale — all in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/post-ad"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-sky-900 shadow-lg shadow-slate-900/20 transition hover:bg-sky-50 hover:shadow-xl sm:px-6 sm:py-3 sm:text-base"
              >
                <Megaphone size={18} />
                Post an ad now
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/10 sm:px-6 sm:py-3 sm:text-base"
              >
                See pricing
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <section className="tk-container py-6 sm:py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:shadow-md sm:p-5"
            >
              <p className="text-2xl font-black text-sky-700 sm:text-3xl">{s.value}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-900 sm:text-sm">{s.label}</p>
              <p className="text-[10px] text-slate-500 sm:text-xs">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="tk-container py-8 sm:py-12">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 sm:text-xs">
            Why go Featured?
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">
            Benefits that actually move the needle
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 sm:text-base">
            Every feature is designed to get your item in front of the right buyer faster.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_BENEFITS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sm">
                <Icon size={20} />
              </div>
              <h3 className="mt-3 text-base font-black text-slate-900 sm:text-lg">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="tk-container py-8 sm:py-12">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 sm:text-xs">
            Simple process
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">
            How Featured Ads work
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 sm:text-base">
            From posting to selling — four simple steps.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map(({ step, title, desc }) => (
            <div
              key={step}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md sm:p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-xs font-black text-white shadow-sm">
                {step}
              </span>
              <h3 className="mt-3 text-base font-black text-slate-900 sm:text-lg">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="tk-container py-8 sm:py-12">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 sm:text-xs">
            Pricing
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">
            Choose a plan that fits your goal
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 sm:text-base">
            All prices in Pakistani Rupees (PKR). One-time fee. No auto-renewal. No hidden charges.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_PLANS.map(({ days, price, perDay, popular, save }) => (
            <div
              key={days}
              className={`relative flex flex-col rounded-2xl border p-5 text-center transition hover:-translate-y-1 hover:shadow-xl sm:p-6 ${
                popular
                  ? "border-sky-400 bg-gradient-to-b from-sky-50 to-white shadow-lg ring-2 ring-sky-400/30"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                  Most Popular
                </span>
              )}
              {save && !popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                  {save}
                </span>
              )}
              <p className="text-sm font-bold text-slate-500">{days} Days</p>
              <p className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">
                Rs {price.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">~Rs {perDay} / day</p>
              <ul className="mt-5 flex-1 space-y-2.5 text-left text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sky-600" />
                  Top search & category placement
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sky-600" />
                  Gold Featured badge on ad
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sky-600" />
                  Homepage banner spotlight
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-sky-600" />
                  Full escrow protection included
                </li>
              </ul>
              <Link
                href="/post-ad"
                className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition sm:py-3 ${
                  popular
                    ? "bg-sky-600 text-white shadow-md hover:bg-sky-700"
                    : "border-2 border-sky-600 text-sky-700 hover:bg-sky-50"
                }`}
              >
                <Rocket size={16} />
                Get started
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-slate-400 sm:text-sm">
          Need a custom package for a shop or bulk listings?{" "}
          <Link href="/support" className="font-bold text-sky-700 hover:underline">
            Contact our team
          </Link>
        </p>
      </section>

      {/* COMPARISON */}
      <section className="tk-container py-8 sm:py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          <h3 className="text-center text-xl font-black text-slate-900 sm:text-2xl">
            Normal vs Featured Ad
          </h3>
          <p className="mt-1 text-center text-sm text-slate-500">
            See exactly what you get when you go Featured.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-3 text-left font-bold text-slate-500">Feature</th>
                  <th className="pb-3 text-center font-bold text-slate-400">Normal</th>
                  <th className="pb-3 text-center font-bold text-sky-700">Featured</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {[
                  ["Search ranking", "Standard order", "Top of results"],
                  ["Homepage visibility", "Not shown", "Banner + grid spotlight"],
                  ["Trust badge", "None", "Gold spark badge"],
                  ["Average time to sell", "7–14 days", "1–3 days"],
                  ["View boost", "1x", "Up to 5x"],
                  ["Escrow protection", "Included", "Included"],
                  ["Support", "Standard", "Standard"],
                ].map(([feature, normal, featured]) => (
                  <tr key={feature} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-semibold sm:py-3.5">{feature}</td>
                    <td className="py-3 text-center text-slate-500 sm:py-3.5">{normal}</td>
                    <td className="py-3 text-center font-bold text-sky-700 sm:py-3.5">{featured}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="tk-container py-8 sm:py-12">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 sm:text-xs">
            Seller stories
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">
            Trusted by sellers across Pakistan
          </h2>
        </div>
        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
            >
              <StarRating count={t.rating} />
              <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-xs font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <section className="tk-container py-8 sm:py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8 lg:p-10">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Lock size={24} />
              </div>
              <h3 className="mt-3 text-base font-black text-slate-900 sm:text-lg">100% Secure</h3>
              <p className="mt-1 text-sm text-slate-600">
                Every featured ad transaction is protected by TrustKar Escrow. Your money is safe until both sides are happy.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Users size={24} />
              </div>
              <h3 className="mt-3 text-base font-black text-slate-900 sm:text-lg">Real Buyers</h3>
              <p className="mt-1 text-sm text-slate-600">
                No bots, no fake leads. TrustKar has a verified user base of real people buying and selling across Pakistan.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <Phone size={24} />
              </div>
              <h3 className="mt-3 text-base font-black text-slate-900 sm:text-lg">Human Support</h3>
              <p className="mt-1 text-sm text-slate-600">
                Stuck somewhere? Our team is here to help. Reach out anytime via the Support page and get real answers fast.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="tk-container py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600 sm:text-xs">
              FAQ
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl lg:text-4xl">
              Everything you need to know
            </h2>
          </div>
          <div className="mt-6 space-y-3 sm:mt-8">
            {FAQS.map(({ q, a }) => (
              <AccordionItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="tk-container pb-10 sm:pb-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 px-6 py-12 text-center text-white shadow-2xl shadow-sky-900/25 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-12 h-36 w-36 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm sm:text-xs">
              <Sparkles size={14} />
              Limited slots available
            </span>
            <h2 className="mt-4 text-2xl font-black sm:text-3xl lg:text-4xl">
              Ready to sell faster?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-sky-100 sm:text-base lg:text-lg">
              Post your ad, pick a Featured plan, and watch the buyers roll in — safely and securely with TrustKar Escrow.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/post-ad"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-sky-900 shadow-lg shadow-slate-900/20 transition hover:bg-sky-50 hover:shadow-xl sm:px-7 sm:py-3.5 sm:text-base"
              >
                <Megaphone size={18} />
                Post your ad now
              </Link>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/10 sm:px-7 sm:py-3.5 sm:text-base"
              >
                Browse listings
                <ArrowRight size={18} />
              </Link>
            </div>
            <p className="mt-4 text-xs text-sky-200/80 sm:text-sm">
              No subscription. No auto-renewal. Pay once, sell fast.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
