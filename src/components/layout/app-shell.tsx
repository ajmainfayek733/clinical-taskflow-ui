"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { clearTokens, useAccessToken } from "@/lib/auth";
import { ui } from "@/lib/ui";

const links = [
  { href: "/tasks", label: "Work Board", shortLabel: "Tasks" },
  { href: "/annotate", label: "Image Review", shortLabel: "Images" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAccessToken();
  const isAuthenticated = Boolean(token);

  function handleSignOut() {
    clearTokens();
    router.push("/login");
  }

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-sm font-bold text-white shadow-sm shadow-teal-900/20">
              CT
            </span>
            <span className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              Clinical TaskFlow
            </span>
          </Link>

          {isAuthenticated ? (
            <nav className="order-3 flex w-full items-center justify-center gap-1 sm:order-2 sm:w-auto sm:justify-start">
              {links.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm ${
                      isActive ? ui.navActive : ui.navInactive
                    }`}
                  >
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <div className={`flex items-center gap-2 ${isAuthenticated ? "order-2 sm:order-3" : "ml-auto"}`}>
            {isAuthenticated ? (
              <button type="button" className={ui.btnDanger} onClick={handleSignOut}>
                Sign out
              </button>
            ) : (
              <Link href="/login" className={ui.btnPrimary}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </div>
  );
}
