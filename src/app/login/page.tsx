"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/ApiClient";
import { setTokens, useAccessToken } from "@/lib/Auth";
import { ui } from "@/lib/Ui";

interface LoginResponse {
  access: string;
  refresh: string;
}

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/tasks";
  }
  return next;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-md px-1 sm:px-0">
          <div className={`${ui.card} p-6 text-center text-sm text-slate-600`}>Loading sign in...</div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAccessToken();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace(getSafeNextPath(searchParams.get("next")));
    }
  }, [token, router, searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await apiClient<LoginResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setTokens(data.access, data.refresh);
      router.push(getSafeNextPath(searchParams.get("next")));
    } catch {
      setError("Login failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  }

  if (token) {
    return (
      <main className="mx-auto w-full max-w-md px-1 sm:px-0">
        <div className={`${ui.card} p-6 text-center text-sm text-slate-600`}>Redirecting...</div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-1 sm:px-0">
      <div className={`${ui.card} overflow-hidden p-6 sm:p-8`}>
        <div className="mb-6 border-l-4 border-teal-600 pl-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Sign in to Clinical TaskFlow
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Access the daily work board and image review tools with your staff credentials.
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-sm">
          <p className="font-semibold text-teal-900">Demo credentials</p>
          <p className="mt-1 text-teal-800/90">demo.doctor@taskflow.local</p>
          <p className="text-teal-800/90">DoctorDemo123!</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className={`mb-1.5 block ${ui.label}`}>
              Email
            </label>
            <input
              id="email"
              className={ui.input}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@clinic.example"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={`mb-1.5 block ${ui.label}`}>
              Password
            </label>
            <input
              id="password"
              className={ui.input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button className={`${ui.btnPrimary} w-full`} type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
