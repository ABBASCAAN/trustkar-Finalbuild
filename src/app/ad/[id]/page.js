"use client";

import { Suspense } from "react";
import AdDetailContent from "./AdDetailContent";
import { Loader2 } from "lucide-react";

export default function AdDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        </div>
      }
    >
      <AdDetailContent />
    </Suspense>
  );
}
