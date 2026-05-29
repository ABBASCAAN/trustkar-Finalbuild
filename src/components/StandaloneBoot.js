"use client";

import { useEffect } from "react";
import { applyStandaloneDocumentClass, markAppInstalled } from "@/lib/standalone";

/** Sets html data attributes for app-shell CSS; listens for PWA install. */
export default function StandaloneBoot() {
  useEffect(() => {
    applyStandaloneDocumentClass();

    const onResize = () => applyStandaloneDocumentClass();
    window.addEventListener("resize", onResize);

    const onInstalled = () => markAppInstalled();
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
