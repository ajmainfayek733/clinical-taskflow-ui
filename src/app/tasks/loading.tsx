export default function TasksLoading() {
  return (
    <main>
      <div className="mb-5 animate-pulse rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-7 w-56 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 rounded bg-slate-100" />
      </div>
      <div className="mb-4 h-14 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((column) => (
          <div key={column} className="h-64 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    </main>
  );
}
