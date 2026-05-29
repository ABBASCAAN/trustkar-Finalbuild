"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Smartphone, X, Download } from "lucide-react";
import { BRAND_NAME } from "@/lib/constants";
import {
  dismissInstallPrompt,
  isStandaloneApp,
  markAppInstalled,
  shouldShowInstallPrompt,
} from "@/lib/standalone";

export default function GetAppInstallPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandaloneApp()) return;
    if (!shouldShowInstallPrompt()) return;
    if (pathname?.startsWith("/auth") || pathname?.startsWith("/admin")) return;

    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    function onBip(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible || isStandaloneApp()) return null;

  function close() {
    dismissInstallPrompt();
    setVisible(false);
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") markAppInstalled();
      setDeferredPrompt(null);
      setVisible(false);
      return;
    }
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !window.MSStream;
    if (isIos) {
      setIosHint(true);
      return;
    }
    setIosHint(true);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[650] bg-slate-900/40 backdrop-blur-[2px] md:hidden"
        aria-hidden
        onClick={close}
      />
      <div
        role="dialog"
        aria-labelledby="get-app-title"
        className="fixed inset-x-3 bottom-[calc(4.75rem+var(--safe-bottom))] z-[660] overflow-hidden rounded-2xl border border-sky-200/80 bg-white shadow-2xl shadow-sky-900/20 md:hidden"
      >
        <div className="bg-gradient-to-r from-sky-600 to-cyan-600 px-4 py-3 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                <Smartphone size={22} />
              </span>
              <div>
                <p id="get-app-title" className="text-sm font-black">
                  Get the {BRAND_NAME} app
                </p>
                <p className="text-[11px] text-sky-100/90">Faster · Escrow deals · No browser bars</p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full p-1.5 text-white/90 hover:bg-white/20"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          {iosHint ? (
            <div className="space-y-2 text-sm text-slate-600">
              <p className="font-bold text-slate-800">Install on your phone</p>
              <p>
                <strong>iPhone:</strong> Tap Share → <strong>Add to Home Screen</strong>
              </p>
              <p>
                <strong>Android:</strong> Menu (⋮) → <strong>Install app</strong> or <strong>Add to Home screen</strong>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              Install TrustKar for a full-screen app experience with escrow checkout, deals, and notifications.
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={handleInstall} className="tk-btn-primary flex-1 !py-2.5 !text-xs">
              <Download size={16} /> {deferredPrompt ? "Install now" : "Get app"}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
            >
              Not now
            </button>
          </div>
          <Link
            href="/support#pwa"
            onClick={close}
            className="mt-2 block text-center text-[11px] font-semibold text-sky-700"
          >
            Installation help →
          </Link>
        </div>
      </div>
    </>
  );
}
