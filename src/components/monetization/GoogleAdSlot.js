"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a Google AdSense unit when admin enables ads and provides client + slot IDs.
 * Free tier: uses your AdSense account; no extra Firebase cost.
 */
export default function GoogleAdSlot({ clientId, slotId, format = "auto", className = "" }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!clientId || !slotId || typeof window === "undefined") return;

    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    let script = document.querySelector(`script[data-adsense="${clientId}"]`);
    if (!script) {
      script = document.createElement("script");
      script.async = true;
      script.src = src;
      script.crossOrigin = "anonymous";
      script.setAttribute("data-adsense", clientId);
      document.head.appendChild(script);
    }

    const tryPush = () => {
      if (pushed.current) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        /* ignore if script not ready */
      }
    };

    script.addEventListener("load", tryPush);
    const t = setTimeout(tryPush, 800);
    return () => {
      script.removeEventListener("load", tryPush);
      clearTimeout(t);
    };
  }, [clientId, slotId]);

  if (!clientId || !slotId) return null;

  return (
    <div className={`overflow-hidden rounded-2xl border border-sky-100 bg-slate-50 ${className}`}>
      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Advertisement</p>
      <ins
        className="adsbygoogle block min-h-[90px] w-full"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
