"use client";

import { useState, useRef } from "react";
import { Search, Loader2, Package, Truck, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function TrackLeoPage() {
  const [cn, setCn] = useState("");
  const [activeCn, setActiveCn] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const formRef = useRef(null);

  function handleSearch(e) {
    e.preventDefault();
    if (!cn.trim()) return;
    setLoading(true);
    setShowResult(false);
    setActiveCn(cn.trim());

    // Submit hidden form to iframe after short delay
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.submit();
      }
      setLoading(false);
      setShowResult(true);
    }, 600);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hidden form — POSTs to Leopards result page in iframe */}
      <form
        ref={formRef}
        action="https://pk.leopardscourier.com/shipment_tracking_view"
        method="POST"
        target="tracking-iframe"
        style={{ display: "none" }}
      >
        <input type="hidden" name="cn_number" value={activeCn} />
      </form>

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

      {/* Result Section — iframe with CSS masking */}
      {showResult && activeCn && (
        <div className="tk-container mt-6 pb-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Truck size={16} className="text-sky-600" />
              <h2 className="text-sm font-black text-slate-800">Tracking Result</h2>
              <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">CN: {activeCn}</span>
            </div>

            {/* Masked iframe container */}
            <div className="relative" style={{ height: "600px", overflow: "hidden" }}>
              {/* Top mask — hides Leopards header + search box */}
              <div className="absolute inset-x-0 top-0 z-10 bg-white" style={{ height: "250px" }} />

              {/* Bottom mask — hides footer */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-white" style={{ height: "80px" }} />

              {/* The iframe showing only result portion */}
              <iframe
                name="tracking-iframe"
                style={{
                  width: "100%",
                  height: "1200px",
                  border: "none",
                  marginTop: "-250px",
                }}
                title="Tracking Result"
              />
            </div>

            {/* Direct link fallback */}
            <div className="border-t border-slate-100 px-5 py-3 text-center">
              <a
                href={`https://pk.leopardscourier.com/shipment_tracking_view?cn_number=${encodeURIComponent(activeCn)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
              >
                <ExternalLink size={12} /> View on Courier Partner
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="tk-container mt-6 pb-12">
          <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-sky-500" />
            <p className="mt-3 text-sm font-bold text-slate-500">Loading tracking details...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!showResult && !loading && (
        <div className="tk-container mt-6 pb-12">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Truck size={48} className="mx-auto text-slate-200" />
            <p className="mt-3 text-sm font-bold text-slate-400">Enter a tracking number above to see shipment details</p>
          </div>
        </div>
      )}
    </div>
  );
}
