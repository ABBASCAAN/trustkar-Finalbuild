import { Suspense } from "react";
import HomeClient from "@/components/HomeClient";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#002f34]" />
        </div>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
