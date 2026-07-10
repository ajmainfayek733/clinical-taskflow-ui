import Link from "next/link";

import { ui } from "@/lib/ui";

export default function Home() {
  return (
    <main className="grid gap-6 lg:grid-cols-2">
      <section className={`${ui.card} relative overflow-hidden p-6 sm:p-8`}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-100/60 blur-3xl" />
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Clinical workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Clinical TaskFlow
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
          A refined workspace for day-based clinical task tracking and structured image annotation
          review.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className={ui.btnPrimary} href="/login">
            Sign in
          </Link>
          <Link className={ui.btnSecondary} href="/tasks">
            Open work board
          </Link>
          <Link className={ui.btnSecondary} href="/annotate">
            Open image review
          </Link>
        </div>
      </section>

      <section className={`${ui.card} p-6 sm:p-8`}>
        <h2 className="text-lg font-semibold text-slate-900">Demo credentials</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Use the seeded demo account to test login, task management, drag and drop, and annotation
          workflows.
        </p>
        <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
          <p className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <span className="font-semibold text-slate-800">Email</span>
            <span className="text-slate-600">demo.doctor@taskflow.local</span>
          </p>
          <p className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
            <span className="font-semibold text-slate-800">Password</span>
            <span className="text-slate-600">DoctorDemo123!</span>
          </p>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          If credentials are not active yet, Contact the developer to seed the demo account.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          For more information, visit the{" "}
          <Link
            target="_blank"
            href="https://github.com/ajmainfayek733/clinical-taskflow-ui"
            className="text-teal-600 hover:text-teal-700"
          >
            GitHub repository
          </Link>
        </p>
      </section>
    </main>
  );
}
