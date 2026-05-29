"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import AdCard from "./AdCard";
import { Loader2, PackageOpen } from "lucide-react";

export default function AdGallery({ categoryId, subcategoryId, leafId, searchQuery }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        let snap;
        try {
          const q = query(
            collection(db, COLLECTIONS.ADS),
            where("status", "==", "active"),
            orderBy("createdAt", "desc"),
            limit(100)
          );
          snap = await getDocs(q);
        } catch {
          const q = query(collection(db, COLLECTIONS.ADS), where("status", "==", "active"), limit(100));
          snap = await getDocs(q);
        }
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return tb - ta;
        });

        if (categoryId) {
          list = list.filter((a) => a.categoryId === categoryId);
        }
        if (subcategoryId) {
          list = list.filter((a) => a.subcategoryId === subcategoryId);
        }
        if (leafId) {
          list = list.filter((a) => a.leafId === leafId);
        }
        if (searchQuery?.trim()) {
          const s = searchQuery.toLowerCase();
          list = list.filter(
            (a) =>
              a.title?.toLowerCase().includes(s) ||
              a.description?.toLowerCase().includes(s) ||
              a.brand?.toLowerCase().includes(s)
          );
        }
        setAds(list);
      } catch (err) {
        console.error(err);
        setError(
          "Could not load listings. Enable Firestore and create a composite index if prompted in the browser console."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId, subcategoryId, leafId, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
        {error}
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-500">
        <PackageOpen className="h-16 w-16 text-slate-300" />
        <p className="mt-4 text-lg font-medium">No listings yet</p>
        <p className="text-sm">Be the first to post on TRUSTKAR!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} />
      ))}
    </div>
  );
}
