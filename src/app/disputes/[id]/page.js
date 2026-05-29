"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function DisputeDetailPage() {
  const { id } = useParams();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, COLLECTIONS.DISPUTES, id)).then((snap) => {
      if (snap.exists()) setDispute({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!dispute) {
    return <p className="p-10 text-center">Dispute not found</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">{dispute.reason}</h1>
      <p className="mt-2 text-sm text-slate-500">
        Status: {dispute.status} · Opened {formatDate(dispute.createdAt)}
      </p>
      {dispute.responseDeadline && (
        <p className="mt-1 text-sm text-amber-700">
          Auto-escalation to admin if no response by{" "}
          {new Date(dispute.responseDeadline).toLocaleString("en-PK")}
        </p>
      )}
      <p className="mt-6 whitespace-pre-wrap text-slate-700">{dispute.description}</p>

      {dispute.evidenceUrls?.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold">Evidence repository</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {dispute.evidenceUrls.map((url, i) => (
              <div key={i} className="relative aspect-video overflow-hidden rounded-lg bg-slate-100">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href="/disputes" className="mt-8 inline-block text-sky-600">
        ← All disputes
      </Link>
    </div>
  );
}
