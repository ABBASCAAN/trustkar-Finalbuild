"use client";

import { Suspense, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function CategoryRedirect() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    if (search) params.set("search", search);
    if (city) params.set("city", city);
    router.replace(`/browse?${params.toString()}`);
  }, [slug, searchParams, router]);

  return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        </div>
      }
    >
      <CategoryRedirect />
    </Suspense>
  );
}
