"use client";

import { useState } from "react";
import { Search, Loader2, Package, Truck, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

function cleanTrackingHtml(html) {
  let h = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*stylesheet[^>]*>/gi, "");

  // Remove structural noise
  h = h
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  // Remove logo / brand images
  h = h
    .replace(/<img[^>]*logo[^>]*>/gi, "")
    .replace(/<img[^>]*leopard[^>]*>/gi, "");

  // Replace Leopards branding text (case insensitive)
  h = h.replace(/Leopards Courier/gi, "Courier Partner");
  h = h.replace(/Leopards/gi, "Courier Partner");
  h = h.replace(/Leopard/gi, "Courier Partner");

  // Extract only the result portion
  const markers = ["Consignment No", "Current Status", "Shipment Detail", "Shipper"];
  let earliest = -1;
  for (const m of markers) {
    const idx = h.toLowerCase().indexOf(m.toLowerCase());
    if (idx > -1 && (earliest === -1 || idx < earliest)) earliest = idx;
  }
  if (earliest > 200) {
    h = h.slice(earliest - 100);
  }

  // Remove tail
  const tail = ["Copyright", "All rights reserved", "Privacy Policy", "Contact Us"];
  for (const t of tail) {
    const idx = h.toLowerCase().indexOf(t.toLowerCase());
    if (idx > -1) h = h.slice(0, idx);
  }

  return h;
}

export default function TrackLeoPage() {
  const [cn, setCn] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [resultType, setResultType] = useState(null); // 'success' | 'error' | 'proxy-failed'
  const [activeCn, setActiveCn] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!cn.trim()) return;
    setLoading(true);
    setResult(null);
    setResultType(null);
    setActiveCn(cn.trim());

    const trackingNum = cn.trim();

    try {
      // --- 17TRACK API ---
      // Step 1: Register tracking number
      const registerRes = await fetch("https://api.17track.net/track/v2.2/gettransinfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "17track-Api-Key": process.env.NEXT_PUBLIC_17TRACK_API_KEY || "",
        },
        body: JSON.stringify({
          data: [{ number: trackingNum }],
        }),
      });

      if (!registerRes.ok) {
        throw new Error("API returned " + registerRes.status);
      }

      const apiData = await registerRes.json();

      // Check if valid data returned
      const item = apiData?.data?.accepted?.[0] || apiData?.data?.rejected?.[0];

      if (!item || item.error) {
        setResult(`Your query about "${trackingNum}" appeared to be invalid / record not found. Please enter a valid / correct consignment number or contact Courier Partner for more details.`);
        setResultType("error");
      } else {
        // Build clean HTML from API response
        const trackInfo = item.track_info || {};
        const shippingInfo = trackInfo.shipping_info || {};
        const latestStatus = trackInfo.latest_status?.status || "N/A";
        const latestEvent = trackInfo.latest_event?.description || "N/A";

        let html = `
          <div style="margin-bottom:1rem">
            <h3 style="font-size:1rem;font-weight:700;color:#0f172a;margin-bottom:0.5rem">Consignment No: ${trackingNum}</h3>
            <p style="font-size:0.875rem;color:#0ea5e9;font-weight:600">Status: ${latestStatus}</p>
          </div>
        `;

        if (shippingInfo) {
          html += `<table style="width:100%;border-collapse:collapse;margin-bottom:1rem">`;
          html += `<thead><tr style="background:#0ea5e9;color:white"><th style="padding:0.5rem;text-align:left;font-size:0.75rem">Field</th><th style="padding:0.5rem;text-align:left;font-size:0.75rem">Details</th></tr></thead>`;
          html += `<tbody>`;

          const rows = [
            ["Shipper", shippingInfo.shipper_name || "N/A"],
            ["Consignee", shippingInfo.recipient_name || "N/A"],
            ["Origin", shippingInfo.shipper_address?.country || "N/A"],
            ["Destination", shippingInfo.recipient_address?.country || "N/A"],
            ["Latest Event", latestEvent],
          ];

          for (const [label, value] of rows) {
            html += `<tr style="border-bottom:1px solid #e2e8f0"><td style="padding:0.5rem;font-weight:600;color:#475569">${label}</td><td style="padding:0.5rem;color:#0f172a">${value}</td></tr>`;
          }

          html += `</tbody></table>`;
        }

        if (trackInfo.tracking?.providers?.[0]?.events?.length) {
          const events = trackInfo.tracking.providers[0].events;
          html += `<h4 style="font-size:0.875rem;font-weight:700;color:#0f172a;margin-bottom:0.5rem">Tracking History</h4>`;
          html += `<table style="width:100%;border-collapse:collapse">`;
          html += `<thead><tr style="background:#0ea5e9;color:white"><th style="padding:0.5rem;text-align:left;font-size:0.75rem">Date</th><th style="padding:0.5rem;text-align:left;font-size:0.75rem">Status</th><th style="padding:0.5rem;text-align:left;font-size:0.75rem">Location</th></tr></thead>`;
          html += `<tbody>`;
          for (const evt of events.slice(0, 10)) {
            const date = evt.time ? new Date(evt.time).toLocaleString() : "N/A";
            html += `<tr style="border-bottom:1px solid #e2e8f0"><td style="padding:0.5rem">${date}</td><td style="padding:0.5rem">${evt.description || "N/A"}</td><td style="padding:0.5rem">${evt.location || "N/A"}</td></tr>`;
          }
          html += `</tbody></table>`;
        }

        setResult(html);
        setResultType("success");
      }
    } catch {
      setResultType("proxy-failed");
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
        {/* Error / Not Found */}
        {resultType === "error" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="text-sm font-medium text-amber-800">{result}</p>
          </div>
        )}

        {/* Proxy failed fallback */}
        {resultType === "proxy-failed" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-700">Unable to fetch tracking details automatically.</p>
            <p className="mt-1 text-xs text-slate-500">You can view the tracking result directly on Courier Partner.</p>
            <a
              href={`https://pk.leopardscourier.com/shipment_tracking_view?cn_number=${encodeURIComponent(activeCn)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tk-btn-primary mt-4 inline-flex items-center justify-center gap-2 text-sm"
            >
              <ExternalLink size={14} /> Open Tracking Result
            </a>
          </div>
        )}

        {/* Success — parsed HTML */}
        {resultType === "success" && result && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
              <Truck size={16} className="text-sky-600" />
              <h2 className="text-sm font-black text-slate-800">Tracking Result</h2>
              <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">CN: {activeCn}</span>
            </div>
            <div
              className="track-result p-5 text-sm text-slate-700"
              dangerouslySetInnerHTML={{ __html: result }}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
            <Loader2 size={32} className="mx-auto animate-spin text-sky-500" />
            <p className="mt-3 text-sm font-bold text-slate-500">Fetching tracking details...</p>
          </div>
        )}

        {/* Empty state */}
        {!resultType && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Truck size={48} className="mx-auto text-slate-200" />
            <p className="mt-3 text-sm font-bold text-slate-400">Enter a tracking number above to see shipment details</p>
          </div>
        )}
      </div>
    </div>
  );
}
