"use client";

import { useState } from "react";
import { Search, Loader2, Package, Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TrackLeoPage() {
  const [cn, setCn] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState(null);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!cn.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setResultType(null);
    try {
      const res = await fetch(`/api/track-shipment?cn=${encodeURIComponent(cn.trim())}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.html || "");
        setResultType(data.type || "text");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style jsx global>{`
        .track-result table {
          width: 100% !important;
          border-collapse: collapse !important;
          border-radius: 0.75rem !important;
          overflow: hidden !important;
          font-size: 0.875rem !important;
        }
        .track-result th,
        .track-result td {
          padding: 0.625rem 1rem !important;
          border: 1px solid #e2e8f0 !important;
          text-align: left !important;
        }
        .track-result th {
          background: #0ea5e9 !important;
          color: white !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 0.75rem !important;
        }
        .track-result tr:nth-child(even) {
          background: #f8fafc !important;
        }
        .track-result tr:hover {
          background: #f1f5f9 !important;
        }
        .track-result td:first-child {
          font-weight: 600 !important;
          color: #475569 !important;
          width: 30% !important;
        }
        .track-result td:last-child {
          color: #0f172a !important;
          font-weight: 500 !important;
        }
        .track-result img {
          max-width: 100% !important;
          height: auto !important;
        }
        .track-result div[align="center"],
        .track-result .text-center {
          text-align: left !important;
        }
        .track-result font[color*="#FFD700"],
        .track-result font[color*="#FFCC00"],
        .track-result font[color*="#FFA500"],
        .track-result [style*="background-color: rgb(255, 204"],
        .track-result [style*="background-color: #FFCC"],
        .track-result [style*="background-color: #FFC"],
        .track-result [style*="background: rgb(255, 204"],
        .track-result [style*="background: #FFCC"],
        .track-result [style*="background: #FFC"] {
          background: #e0f2fe !important;
          color: #0369a1 !important;
        }
        .track-result [style*="background-color: rgb(68, 68"],
        .track-result [style*="background-color: #444"],
        .track-result [style*="background: rgb(68, 68"],
        .track-result [style*="background: #444"] {
          background: #0ea5e9 !important;
          color: white !important;
        }
        .track-result h1, .track-result h2, .track-result h3, .track-result h4 {
          color: #0f172a !important;
          font-weight: 700 !important;
        }
        .track-result a {
          color: #0ea5e9 !important;
        }
        .track-result br + br {
          display: none !important;
        }
      `}</style>
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-cyan-600 py-8">
        <div className="tk-container">
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-white/80 transition hover:text-white">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <h1 className="mt-3 text-2xl font-black text-white sm:text-3xl">Track Your Shipment</h1>
          <p className="mt-1 text-sm text-white/80">Enter your consignment number to get real-time tracking updates</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="tk-container -mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-7">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Package size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={cn}
                onChange={(e) => setCn(e.target.value)}
                placeholder="Enter consignment / tracking number"
                className="tk-input w-full pl-10 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="tk-btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {loading ? "Tracking..." : "Track Shipment"}
            </button>
          </form>
        </div>
      </div>

      {/* Result Section */}
      <div className="tk-container mt-6 pb-12">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Truck size={16} className="text-sky-600" />
              <h2 className="text-sm font-black text-slate-800">Tracking Result</h2>
              <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">CN: {cn}</span>
            </div>
            <div className="p-5">
              {resultType === "error" ? (
                <div className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
                  {result}
                </div>
              ) : (
                <div
                  className="track-result text-sm text-slate-700"
                  dangerouslySetInnerHTML={{ __html: result }}
                />
              )}
            </div>
          </div>
        )}

        {!result && !error && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Truck size={48} className="mx-auto text-slate-200" />
            <p className="mt-3 text-sm font-bold text-slate-400">Enter a tracking number above to see shipment details</p>
          </div>
        )}
      </div>
    </div>
  );
}
