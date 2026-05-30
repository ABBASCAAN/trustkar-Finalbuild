"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  fetchPendingOtpVerifications,
  markOtpSent,
} from "@/lib/firestore-helpers";
import { formatPakPhone, getPhoneDigitsForWa } from "@/lib/utils";
import {
  Smartphone,
  Copy,
  Share2,
  Send,
  CheckCircle,
  Loader2,
  RefreshCw,
  MessageCircle,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Flame,
} from "lucide-react";

const OTP_DURATION_MS = 10 * 60 * 1000; // 10 minutes

function useCountdown(expiresAtSeconds) {
  const [left, setLeft] = useState(() => computeLeft(expiresAtSeconds));

  useEffect(() => {
    setLeft(computeLeft(expiresAtSeconds));
    const id = setInterval(() => setLeft(computeLeft(expiresAtSeconds)), 1000);
    return () => clearInterval(id);
  }, [expiresAtSeconds]);

  return left;
}

function computeLeft(expiresAtSeconds) {
  if (!expiresAtSeconds) return 0;
  const diff = expiresAtSeconds * 1000 - Date.now();
  return Math.max(0, diff);
}

function formatCountdown(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ExpiryBadge({ msLeft }) {
  const pct = Math.max(0, Math.min(100, (msLeft / OTP_DURATION_MS) * 100));
  const isUrgent = msLeft <= 2 * 60 * 1000; // under 2 min
  const isDanger = msLeft <= 1 * 60 * 1000; // under 1 min

  const colorClass = isDanger
    ? "bg-red-50 text-red-700 border-red-200"
    : isUrgent
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const barColor = isDanger
    ? "bg-red-500"
    : isUrgent
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className={`rounded-lg border ${colorClass} px-2.5 py-1`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {isDanger ? <Flame size={12} /> : <Clock size={12} />}
          <span className="text-[11px] font-black tabular-nums">
            {formatCountdown(msLeft)}
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase opacity-70">
          {isDanger ? "Expiring" : "Remaining"}
        </span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OtpCard({ item, isCopied, onCopy, onWhatsApp, onMarkSent }) {
  const phone = item.phone || "";
  const otpCode = item.otp || "";
  const formattedPhone = formatPakPhone(phone);
  const expiresAt = item.expiresAt?.seconds;
  const msLeft = useCountdown(expiresAt);
  const isExpired = msLeft <= 0;

  if (isExpired) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Top row: phone + badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sm">
            <Smartphone size={14} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">{formattedPhone}</p>
            <p className="text-[10px] text-slate-400">{phone}</p>
          </div>
        </div>
        {item.status === "sent" && (
          <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-700">
            Sent
          </span>
        )}
      </div>

      {/* OTP Code */}
      <button
        type="button"
        onClick={() => onCopy(otpCode, item.id)}
        className="group relative w-full rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/60 p-3 text-center transition hover:border-sky-400 hover:bg-sky-50 active:scale-[0.98]"
      >
        <p className="text-[9px] font-bold uppercase tracking-wider text-sky-500">Tap to copy OTP</p>
        <p className="mt-1 text-2xl font-black tracking-[0.25em] text-sky-800 sm:text-3xl">
          {otpCode}
        </p>
        {isCopied && (
          <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
            <CheckCircle size={10} /> Copied
          </span>
        )}
      </button>

      {/* Countdown */}
      <ExpiryBadge msLeft={msLeft} />

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onCopy(otpCode, item.id)}
          className="flex items-center justify-center gap-1 rounded-lg bg-slate-100 py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200"
        >
          <Copy size={13} />
          Copy
        </button>

        <button
          type="button"
          onClick={() => onWhatsApp(phone, otpCode)}
          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-700"
        >
          <Share2 size={13} />
          WhatsApp
        </button>

        <button
          type="button"
          onClick={() => onMarkSent(item.id)}
          className="flex items-center justify-center gap-1 rounded-lg bg-sky-600 py-2 text-[11px] font-bold text-white transition hover:bg-sky-700"
        >
          <Send size={13} />
          Sent
        </button>
      </div>
    </div>
  );
}

export default function OtpAppPage() {
  const router = useRouter();
  const [otps, setOtps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadOtps = useCallback(async () => {
    try {
      const data = await fetchPendingOtpVerifications();
      setOtps(data);
      setLastUpdated(new Date());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    loadOtps();
    const id = setInterval(loadOtps, 5000);
    return () => clearInterval(id);
  }, [loadOtps]);

  function handleCopy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleShareWhatsApp(phone, otp) {
    const waNumber = getPhoneDigitsForWa(phone);
    const text = `Your TrustKar verification OTP is: ${otp}\n\nValid for 10 minutes. Do not share this with anyone.`;
    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  async function handleMarkSent(id) {
    try {
      await markOtpSent(id);
      await loadOtps();
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50">
      {/* Fixed enterprise header */}
      <div className="shrink-0 border-b border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-cyan-700 text-[10px] font-black text-white shadow-sm">
              TK
            </span>
            <div>
              <h1 className="text-base font-black text-slate-900">OTP Manager</h1>
              <p className="text-[10px] font-medium text-slate-400">
                {lastUpdated
                  ? `Synced ${lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : "Loading…"}
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700 sm:inline-block">
              {otps.length} pending
            </span>
            <button
              type="button"
              onClick={loadOtps}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600 transition hover:bg-sky-200"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable OTP Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 sm:px-6">
        {loading && otps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 size={32} className="animate-spin text-sky-500" />
            <p className="mt-3 text-sm font-bold text-slate-500">Fetching OTPs…</p>
          </div>
        )}

        {!loading && otps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="mt-3 text-sm font-black text-slate-700">All caught up</p>
            <p className="mt-1 text-xs text-slate-400">No pending OTP verifications</p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {otps.map((item) => (
            <OtpCard
              key={item.id}
              item={item}
              isCopied={copiedId === item.id}
              onCopy={handleCopy}
              onWhatsApp={handleShareWhatsApp}
              onMarkSent={handleMarkSent}
            />
          ))}
        </div>

        {/* Footer helper */}
        {otps.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-4 rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-2.5 text-center">
            <p className="text-[10px] font-bold text-amber-700">
              <AlertTriangle size={12} className="mr-1 inline" />
              OTPs auto-expire in 10 minutes
            </p>
            <p className="text-[10px] font-medium text-amber-600/70">
              <MessageCircle size={12} className="mr-1 inline" />
              Tap WhatsApp to send pre-filled message
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
