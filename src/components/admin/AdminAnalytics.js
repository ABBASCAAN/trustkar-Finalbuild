"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, Users, Package, CreditCard } from "lucide-react";

function BarChart({ data, labelKey, valueKey, color = "bg-sky-500" }) {
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const v = d[valueKey] || 0;
        const pct = (v / max) * 100;
        return (
          <div key={d[labelKey]} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs font-bold text-slate-600">{d[labelKey]}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-[10px] font-bold text-slate-500">{v}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics({ ads, users, transactions }) {
  const [period, setPeriod] = useState("daily");

  const stats = useMemo(() => {
    const now = new Date();
    const activeAds = ads.filter((a) => a.status === "active").length;
    const totalUsers = users.length;
    const totalDeals = transactions.length;
    const escrowHeld = transactions
      .filter((t) => t.status === "funds_held" || t.status === "pending_release")
      .reduce((s, t) => s + (t.amount || 0), 0);

    const byDay = (items, dateField = "createdAt") => {
      const map = {};
      items.forEach((it) => {
        const d = it[dateField]?.toDate ? it[dateField].toDate() : new Date(it[dateField] || 0);
        const key = d.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
        map[key] = (map[key] || 0) + 1;
      });
      return Object.entries(map)
        .map(([label, value]) => ({ label, value }))
        .slice(-7);
    };

    const byMonth = (items, dateField = "createdAt") => {
      const map = {};
      items.forEach((it) => {
        const d = it[dateField]?.toDate ? it[dateField].toDate() : new Date(it[dateField] || 0);
        const key = d.toLocaleDateString("en-PK", { month: "short", year: "2-digit" });
        map[key] = (map[key] || 0) + 1;
      });
      return Object.entries(map)
        .map(([label, value]) => ({ label, value }))
        .slice(-12);
    };

    const dailyDeals = byDay(transactions, "createdAt");
    const monthlyDeals = byMonth(transactions, "createdAt");
    const dailyAds = byDay(ads, "createdAt");
    const monthlyAds = byMonth(ads, "createdAt");

    return { activeAds, totalUsers, totalDeals, escrowHeld, dailyDeals, monthlyDeals, dailyAds, monthlyAds };
  }, [ads, users, transactions]);

  const dealData = period === "daily" ? stats.dailyDeals : stats.monthlyDeals;
  const adData = period === "daily" ? stats.dailyAds : stats.monthlyAds;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Active ads", stats.activeAds, Package],
          ["Users", stats.totalUsers, Users],
          ["Total deals", stats.totalDeals, CreditCard],
          ["Escrow held", formatPrice(stats.escrowHeld), TrendingUp],
        ].map(([label, val, Icon]) => (
          <div key={label} className="tk-card !p-4">
            <div className="flex items-center gap-2">
              <Icon size={16} className="text-sky-600" />
              <p className="text-xs font-bold text-slate-500">{label}</p>
            </div>
            <p className="mt-1 text-2xl font-black">{val}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {["daily", "monthly"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
              period === p ? "bg-sky-600 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="tk-card space-y-4">
          <h3 className="font-bold">Deals {period}</h3>
          <BarChart data={dealData} labelKey="label" valueKey="value" />
        </div>
        <div className="tk-card space-y-4">
          <h3 className="font-bold">Ads {period}</h3>
          <BarChart data={adData} labelKey="label" valueKey="value" color="bg-cyan-500" />
        </div>
      </div>
    </div>
  );
}
