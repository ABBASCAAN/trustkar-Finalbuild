"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Legacy checkout URLs redirect to the deal room */
export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/deal/${id}`);
  }, [id, router]);

  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
    </div>
  );
}
