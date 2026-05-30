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

function Confetti() {
  const colors = ["#f59e0b", "#10b981", "#0ea5e9", "#ef4444", "#8b5cf6", "#ec4899"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => {
        const left = Math.random() * 100;
        const animDuration = 2 + Math.random() * 3;
        const delay = Math.random() * 1.5;
        const size = 6 + Math.random() * 8;
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              animation: `confetti-fall ${animDuration}s ease-out ${delay}s forwards`,
              opacity: 0,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          20% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Firework({ left, delay, color }) {
  return (
    <div
      className="pointer-events-none absolute top-1/2 z-[60]"
      style={{ left: `${left}%`, animation: `firework-pop 1.2s ease-out ${delay}s forwards`, opacity: 0 }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: color,
            transform: `rotate(${i * 30}deg) translateX(0)`,
            animation: `firework-spark 1.2s ease-out ${delay}s forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes firework-pop {
          0% { transform: scale(0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes firework-spark {
          0% { transform: rotate(var(--r, 0deg)) translateX(0); opacity: 1; }
          100% { transform: rotate(var(--r, 0deg)) translateX(80px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function FireworksBurst() {
  const bursts = [
    { left: 20, delay: 0.2, color: "#f59e0b" },
    { left: 50, delay: 0.6, color: "#0ea5e9" },
    { left: 80, delay: 1.0, color: "#10b981" },
    { left: 35, delay: 1.4, color: "#ef4444" },
    { left: 65, delay: 1.8, color: "#8b5cf6" },
  ];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {bursts.map((b, i) => (
        <Firework key={i} left={b.left} delay={b.delay} color={b.color} />
      ))}
    </div>
  );
}

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const businessCreated = searchParams.get("business_created") === "1";
  const storeSlug = searchParams.get("store");
  const [showModal, setShowModal] = useState(businessCreated);
  const [showEffects, setShowEffects] = useState(businessCreated);

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
      {showEffects && <Confetti />}
      {showEffects && <FireworksBurst />}

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
