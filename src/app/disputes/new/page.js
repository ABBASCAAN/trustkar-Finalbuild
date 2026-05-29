"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { raiseDealDispute } from "@/lib/firestore-helpers";
import { uploadImagesToCloudinary } from "@/lib/cloudinary";
import { Loader2 } from "lucide-react";
import Link from "next/link";

function NewDisputeForm() {
  const searchParams = useSearchParams();
  const txId = searchParams.get("tx");
  const { user } = useAuth();
  const router = useRouter();

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!txId || !user) {
      setError("Missing transaction.");
      return;
    }

    setSubmitting(true);
    try {
      let evidenceUrls = [];
      if (files.length) {
        const uploaded = await uploadImagesToCloudinary(files, { folder: "trustkar/disputes" });
        evidenceUrls = uploaded.map((u) => u.secureUrl);
      }

      const disputeId = await raiseDealDispute(txId, user.uid, {
        reason,
        description,
        evidenceUrls,
      });

      router.push(`/disputes/${disputeId}`);
    } catch (err) {
      setError(err.message || "Failed to open dispute");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tk-container max-w-xl py-10">
      <h1 className="text-2xl font-black">Raise dispute</h1>
      <p className="mt-2 text-sm text-slate-600">
        Funds stay locked until TrustKar admin reviews evidence and decides refund or release.
      </p>

      <form onSubmit={handleSubmit} className="tk-card mt-8 space-y-4">
        <input
          required
          placeholder="Short reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="tk-input"
        />
        <textarea
          required
          rows={4}
          placeholder="Detailed description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="tk-input min-h-[100px]"
        />
        <div>
          <label className="text-sm font-medium">Evidence (photos)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-2 block w-full text-sm"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-red-600 py-3 font-bold text-white disabled:opacity-50">
          {submitting ? "Submitting…" : "Open dispute — pause escrow"}
        </button>
      </form>
      <Link href={txId ? `/deal/${txId}` : "/dashboard"} className="mt-4 block text-center text-sm text-sky-600">
        Cancel
      </Link>
    </div>
  );
}

export default function NewDisputePage() {
  return (
    <Suspense fallback={<Loader2 className="mx-auto mt-20 h-10 w-10 animate-spin text-sky-600" />}>
      <NewDisputeForm />
    </Suspense>
  );
}
