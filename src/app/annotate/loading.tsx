export default function AnnotateLoading() {
  return (
    <main>
      <div className="mb-5 animate-pulse rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-7 w-52 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-96 rounded bg-slate-100" />
      </div>
      <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 h-24 rounded-lg bg-slate-100" />
        <div className="mx-auto aspect-square max-w-[640px] rounded-lg bg-slate-200" />
      </div>
    </main>
  );
}
