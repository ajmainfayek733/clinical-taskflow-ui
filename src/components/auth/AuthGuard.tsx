"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAccessToken } from "@/lib/Auth";
import { ui } from "@/lib/Ui";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAccessToken();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [token, router, pathname]);

  if (!token) {
    return (
      <div className={`${ui.card} p-6 text-center text-sm text-slate-600`}>
        Redirecting to sign in...
      </div>
    );
  }

  return <>{children}</>;
}
