"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { subscribeSponsoredBanners, subscribeHomepageSettings } from "@/lib/firestore-helpers";
import GoogleAdSlot from "@/components/monetization/GoogleAdSlot";

export default function HomePromoSlots() {
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const unsubSettings = subscribeHomepageSettings(setSettings);
    const unsubBanners = subscribeSponsoredBanners(setBanners);
    return () => {
      unsubSettings();
      unsubBanners();
    };
  }, []);

  if (!settings) return null;

  const showBanners = settings.showPaidBanners === true;
  const showAds = settings.showGoogleAds === true && settings.googleAdsClientId;

  if (!showBanners && !showAds) return null;

  const bySlot = (slot) => banners.filter((b) => b.slot === slot && b.active !== false);
  const hero = bySlot("hero")[0];
  const cta1 = bySlot("cta_primary")[0];
  const cta2 = bySlot("cta_secondary")[0];
  const hasBannerContent = hero || cta1 || cta2;

  return (
    <div className="tk-container space-y-4 py-4">
      {showAds && settings.googleAdSlotHero && (
        <GoogleAdSlot
          clientId={settings.googleAdsClientId}
          slotId={settings.googleAdSlotHero}
          className="mb-2"
        />
      )}

      {showBanners && hasBannerContent && (
        <>
          {hero && <SponsoredBlock banner={hero} large />}
          {(cta1 || cta2) && (
            <div className="grid gap-4 md:grid-cols-2">
              {cta1 && <SponsoredBlock banner={cta1} />}
              {cta2 && <SponsoredBlock banner={cta2} />}
            </div>
          )}
        </>
      )}

      {showAds && settings.googleAdSlotMid && (
        <GoogleAdSlot clientId={settings.googleAdsClientId} slotId={settings.googleAdSlotMid} />
      )}
    </div>
  );
}

function SponsoredBlock({ banner, large }) {
  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-md ${
        large ? "min-h-[140px] sm:min-h-[180px]" : "min-h-[100px]"
      }`}
    >
      {banner.imageUrl ? (
        <Image src={banner.imageUrl} alt={banner.title || "Sponsored"} fill className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full min-h-[inherit] flex-col justify-center bg-gradient-to-br from-sky-100 to-cyan-100 p-6">
          <p className="text-lg font-black text-sky-900">{banner.title}</p>
          {banner.subtitle && <p className="text-sm text-sky-800/80">{banner.subtitle}</p>}
        </div>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white">
        Sponsored
      </span>
    </div>
  );

  if (banner.linkUrl) {
    const external = banner.linkUrl.startsWith("http");
    if (external) {
      return (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
          {inner}
        </a>
      );
    }
    return (
      <Link href={banner.linkUrl} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
