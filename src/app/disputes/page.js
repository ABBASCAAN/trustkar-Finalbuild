"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import { Loader2, AlertTriangle } from "lucide-react";

export default function DisputesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?redirect=/disputes");
      return;
    }
    load();
  }, [user, authLoading]);

  async function load() {
    try {
      const q1 = query(collection(db, COLLECTIONS.DISPUTES), where("buyerId", "==", user.uid));
      const q2 = query(collection(db, COLLECTIONS.DISPUTES), where("sellerId", "==", user.uid));
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const map = new Map();
      [...s1.docs, ...s2.docs].forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
      setDisputes(Array.from(map.values()));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <h1 className="text-2xl font-bold">TRUSTKAR Dispute Center</h1>
      </div>
      <p className="mt-2 text-slate-600">
        Funds stay locked when a dispute is open. Admin mediation after 48 hours if unresolved.
      </p>

      {disputes.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">No disputes on your account.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {disputes.map((d) => (
            <li key={d.id} className="rounded-xl border bg-white p-4">
              <p className="font-medium">{d.reason}</p>
              <p className="text-sm text-slate-500">Status: {d.status}</p>
              <p className="text-xs text-slate-400">Opened {formatDate(d.createdAt)}</p>
              <Link href={`/disputes/${d.id}`} className="mt-2 inline-block text-sm text-sky-600">
                View evidence →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
