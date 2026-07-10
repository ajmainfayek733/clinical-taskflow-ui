export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-linear-to-br from-white via-white to-teal-50/50 p-5 shadow-sm shadow-slate-200/50 sm:p-6">
      <div className="border-l-4 border-teal-600 pl-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </div>
  );
}
