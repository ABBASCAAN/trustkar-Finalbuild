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
} from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-sky-50/90 to-[var(--tk-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-sky-200/80 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-black text-slate-900">TrustKar OTP</h1>
            <p className="text-[10px] font-medium text-slate-500">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "Loading…"}
            </p>
          </div>
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

      {/* OTP Cards */}
      <div className="px-4 py-4 sm:px-6">
        {otps.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle size={48} className="text-emerald-400" />
            <p className="mt-4 text-sm font-bold text-slate-600">No pending OTPs</p>
            <p className="mt-1 text-xs text-slate-400">All caught up!</p>
          </div>
        )}

        <div className="space-y-3">
          {otps.map((item) => {
            const phone = item.phone || "";
            const otpCode = item.otp || "";
            const formattedPhone = formatPakPhone(phone);
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm"
              >
                {/* Phone number */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100">
                    <Smartphone size={14} className="text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{formattedPhone}</p>
                    <p className="text-[10px] text-slate-400">{phone}</p>
                  </div>
                </div>

                {/* OTP display */}
                <div className="mb-3 rounded-xl bg-sky-50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase text-sky-600">OTP Code</p>
                  <p className="mt-1 text-3xl font-black tracking-[0.3em] text-sky-800">
                    {otpCode}
                  </p>
                  <p className="mt-1 text-[10px] text-sky-500">Valid 10 minutes</p>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(otpCode, item.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                      isCopied
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                    {isCopied ? "Copied" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareWhatsApp(phone, otpCode)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <Share2 size={14} />
                    WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkSent(item.id)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white transition hover:bg-sky-700"
                  >
                    <Send size={14} />
                    Mark Sent
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick message helper */}
        {otps.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
            <p className="text-[10px] font-bold text-amber-700">
              <MessageCircle size={12} className="mr-1 inline" />
              Tip: Tap WhatsApp to open chat directly with the pre-filled OTP message
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
