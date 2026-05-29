"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";

/**
 * Blocks page until user is signed in. Used for Post Ad etc.
 */
export default function RequireAuth({ children }) {
  const { user, loading, isSuspended } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        <p className="text-sm text-slate-600">Checking {BRAND_NAME} account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-slate-600">Sign in required...</p>
        <Link href={`/auth/login?redirect=${encodeURIComponent(pathname)}`} className="mt-4 inline-block text-cyan-600 hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  if (isSuspended) {
    return (
      <div className="tk-container py-20 text-center">
        <p className="font-bold text-red-600">Account suspended</p>
        <Link href="/support" className="mt-4 inline-block text-cyan-600 hover:underline">
          Contact support
        </Link>
      </div>
    );
  }

  return children;
}
