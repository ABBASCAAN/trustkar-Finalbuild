"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import HeroSearch from "./HeroSearch";
import CategoriesGrid from "./CategoriesGrid";
import HomePromoSlots from "./HomePromoSlots";
import HomeCategoryRibbon from "./HomeCategoryRibbon";
import HomeFeaturedBanner from "./HomeFeaturedBanner";
import HomeCategoryRows from "./HomeCategoryRows";
import Link from "next/link";
import { Truck, Star, Handshake, Clock3, Store, X, LayoutGrid } from "lucide-react";

function ElegantFirework({ offsetX, offsetY, delay, color }) {
  const dots = 16;
  return (
    <div
      className="pointer-events-none absolute z-[60]"
      style={{
        left: `calc(50% + ${offsetX}px)`,
        top: `calc(50% + ${offsetY}px)`,
        animation: `ef-pop 2s ease-out ${delay}s forwards`,
        opacity: 0,
      }}
    >
      {Array.from({ length: dots }).map((_, i) => {
        const angle = (i / dots) * 360;
        const dist = 60 + Math.random() * 50;
        const dx = Math.cos((angle * Math.PI) / 180) * dist;
        const dy = Math.sin((angle * Math.PI) / 180) * dist;
        return (
          <div
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: color,
              "--dx": `${dx}px`,
              "--dy": `${dy}px`,
              animation: `ef-spark ${1.2 + Math.random() * 0.6}s ease-out ${delay + 0.1}s forwards`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}

function ElegantFireworks() {
  const bursts = [
    { offsetX: -160, offsetY: -120, delay: 0.1, color: "#f59e0b" },
    { offsetX: 160, offsetY: -120, delay: 0.3, color: "#0ea5e9" },
    { offsetX: -110, offsetY: 40, delay: 0.5, color: "#10b981" },
    { offsetX: 110, offsetY: 40, delay: 0.7, color: "#f59e0b" },
    { offsetX: 0, offsetY: -90, delay: 0.9, color: "#ec4899" },
    { offsetX: -70, offsetY: -40, delay: 1.2, color: "#8b5cf6" },
    { offsetX: 70, offsetY: -40, delay: 1.4, color: "#0ea5e9" },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      {bursts.map((b, i) => (
        <ElegantFirework key={i} offsetX={b.offsetX} offsetY={b.offsetY} delay={b.delay} color={b.color} />
      ))}
    </div>
  );
}

function GoldenParticles() {
  const particles = [
    { x: -140, y: -100, d: 0.0, c: "#f59e0b" },
    { x: 120, y: -80, d: 0.15, c: "#10b981" },
    { x: -80, y: 60, d: 0.3, c: "#0ea5e9" },
    { x: 100, y: 50, d: 0.45, c: "#f59e0b" },
    { x: 0, y: -60, d: 0.6, c: "#ec4899" },
    { x: -50, y: -20, d: 0.75, c: "#8b5cf6" },
    { x: 50, y: -30, d: 0.9, c: "#0ea5e9" },
    { x: -120, y: 20, d: 1.05, c: "#10b981" },
    { x: 140, y: -10, d: 1.2, c: "#f59e0b" },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            backgroundColor: p.c,
            boxShadow: `0 0 6px ${p.c}`,
            animation: `gp-fade 2s ease-out ${p.d}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const businessCreated = searchParams.get("business_created") === "1";
  const storeSlug = searchParams.get("store");
  const [showModal, setShowModal] = useState(businessCreated);
  const [showEffects, setShowEffects] = useState(businessCreated);
  const isBusinessUser = user && profile?.accountType === "business" && profile?.storeSlug;

  useEffect(() => {
    if (businessCreated) {
      setShowModal(true);
      setShowEffects(true);
      const timer = setTimeout(() => setShowEffects(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [businessCreated]);

  function dismissModal() {
    setShowModal(false);
    router.replace("/", { scroll: false });
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--tk-bg)]">
      {showEffects && <ElegantFireworks />}
      {showEffects && <GoldenParticles />}

      {/* Business Created Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-3xl border-2 border-emerald-300 bg-white p-6 shadow-2xl sm:max-w-md sm:p-8">
            <button
              onClick={dismissModal}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            >
              <X size={16} />
            </button>

            <div className="mb-5 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                <Store size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                Congratulations!
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Your business account has been created successfully.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Access your store anytime from the{" "}
                <span className="font-bold text-emerald-700">My Store</span>{" "}
                section in the navigation bar.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href={storeSlug ? `/store/${storeSlug}` : "/seller-dashboard"}
                onClick={() => setShowModal(false)}
                className="tk-btn-primary flex items-center justify-center gap-2 !py-3 text-sm font-bold"
              >
                <Store size={16} /> Go To My Store
              </Link>
              <Link
                href="/browse"
                onClick={() => setShowModal(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                <LayoutGrid size={16} /> Browse Ads
              </Link>
            </div>
          </div>
        </div>
      )}

      <HeroSearch />

      {/* Brand slogan — English, enterprise feel */}
      <section className="tk-container pb-1 pt-1">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#053a78] via-[#0a5cad] to-[#0ea5e9] px-5 py-7 text-white shadow-lg shadow-sky-900/15 sm:rounded-3xl sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-200 sm:text-xs">
            TRUSTKAR.PK
          </p>
          <h2 className="mt-2 max-w-2xl text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Buy with confidence.
            <br className="hidden sm:block" />
            <span className="text-sky-200"> Sell with peace of mind.</span>
          </h2>
          <p className="mt-2 max-w-xl text-xs text-sky-100/90 sm:text-sm">
            Pakistan&apos;s escrow-protected marketplace — verified listings, secure payments, and
            transparent deal tracking in one place.
          </p>
        </div>
      </section>

      <HomeCategoryRibbon />

      <section className="relative z-[1] tk-container py-3 sm:py-4">
        <CategoriesGrid />
      </section>

      <HomeFeaturedBanner />

      <HomeCategoryRows />
      <HomePromoSlots />

      <section className="tk-container pb-10 pt-2 sm:pb-12">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            [Handshake, "Escrow-first checkout", "Funds protected until buyer confirms"],
            [Clock3, "Milestone timeline", "Clear status from payment to release"],
            [Truck, "Courier ready", "Ship and track across Pakistan"],
            [Star, "Trust score system", "Ratings on every seller"],
          ].map(([Icon, title, sub]) => (
            <div
              key={title}
              className="rounded-xl border border-sky-100 bg-white p-3 text-center shadow-sm sm:rounded-2xl sm:p-4"
            >
              <Icon className="mx-auto h-6 w-6 text-cyan-600 sm:h-7 sm:w-7" />
              <p className="mt-1.5 text-[11px] font-bold text-slate-900 sm:text-sm">{title}</p>
              <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">{sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500 sm:mt-8 sm:text-sm">
          Ready to shop?{" "}
          <Link href="/browse" className="font-bold text-sky-700 hover:underline">
            Explore all listings
          </Link>
          {" · "}
          <Link href="/compare" className="font-bold text-sky-700 hover:underline">
            Why escrow matters
          </Link>
          {" · "}
          <Link href="/support#escrow-policy" className="font-bold text-sky-700 hover:underline">
            Escrow policy
          </Link>
        </p>
      </section>
    </div>
  );
}
