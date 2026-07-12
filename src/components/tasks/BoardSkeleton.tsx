import { ui } from "@/lib/Ui";

export function BoardSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-5 md:grid-cols-3">
      {[1, 2, 3].map((column) => (
        <div key={column} className={`${ui.card} p-4`}>
          <div className="mb-4 h-4 w-24 rounded-lg bg-slate-200" />
          <div className="space-y-3">
            <div className="h-20 rounded-xl bg-slate-100" />
            <div className="h-20 rounded-xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
