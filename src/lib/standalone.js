/** Detect PWA / Web2App / installed app — do not show browser install prompts. */

const STANDALONE_KEY = "tk_standalone_session";
const INSTALLED_KEY = "tk_installed_app";
const PROMPT_DISMISS_KEY = "tk_app_prompt_dismissed_at";
const PROMPT_DISMISS_DAYS = 7;

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;

  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;

  // iOS Safari “Add to Home Screen”
  if (window.navigator.standalone === true) return true;

  if (localStorage.getItem(INSTALLED_KEY) === "1") return true;
  if (sessionStorage.getItem(STANDALONE_KEY) === "1") return true;

  const params = new URLSearchParams(window.location.search);
  const source = (params.get("utm_source") || params.get("source") || "").toLowerCase();
  if (
    source === "web2app" ||
    source === "pwa" ||
    params.get("standalone") === "1" ||
    params.get("pwa") === "1" ||
    params.get("mode") === "standalone"
  ) {
    sessionStorage.setItem(STANDALONE_KEY, "1");
    return true;
  }

  if (document.referrer && /android-app:\/\//i.test(document.referrer)) {
    sessionStorage.setItem(STANDALONE_KEY, "1");
    return true;
  }

  const ua = navigator.userAgent || "";
  // Common Android WebView / in-app browser shells (Web2App wrappers)
  if (/;\s*wv\)/i.test(ua) || /WebView/i.test(ua)) {
    if (!/Chrome\/[\d.]+ Mobile Safari/i.test(ua)) {
      sessionStorage.setItem(STANDALONE_KEY, "1");
      return true;
    }
  }

  return false;
}

export function markAppInstalled() {
  if (typeof window === "undefined") return;
  localStorage.setItem(INSTALLED_KEY, "1");
  sessionStorage.setItem(STANDALONE_KEY, "1");
}

export function isMobileBrowser() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function shouldShowInstallPrompt() {
  if (typeof window === "undefined") return false;
  if (!isMobileBrowser()) return false;
  if (isStandaloneApp()) return false;

  const dismissed = localStorage.getItem(PROMPT_DISMISS_KEY);
  if (dismissed) {
    const elapsed = Date.now() - Number(dismissed);
    if (elapsed < PROMPT_DISMISS_DAYS * 24 * 60 * 60 * 1000) return false;
  }
  return true;
}

export function dismissInstallPrompt() {
  localStorage.setItem(PROMPT_DISMISS_KEY, String(Date.now()));
}

export function applyStandaloneDocumentClass() {
  if (typeof document === "undefined") return;
  const standalone = isStandaloneApp();
  document.documentElement.dataset.standalone = standalone ? "true" : "false";
  document.documentElement.dataset.mobile = isMobileBrowser() ? "true" : "false";
}
