"use client";

import type { Annotation } from "@/types/Annotation";
import { ui } from "@/lib/Ui";
import { RiDeleteBin6Line } from "react-icons/ri";

export function ShapeList({
  annotations,
  selectedIds,
  onToggle,
  onDeleteSelected,
  isDeleting,
}: {
  annotations: Annotation[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onDeleteSelected: () => void;
  isDeleting: boolean;
}) {
  const hasSelection = selectedIds.length > 0;

  return (
    <div className={`${ui.card} p-3`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Saved polygons (current image)
        </h2>
        <button
          type="button"
          title="Delete selected polygons"
          aria-label="Delete selected polygons"
          disabled={!hasSelection || isDeleting}
          onClick={onDeleteSelected}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <RiDeleteBin6Line size={18} />
        </button>
      </div>

      {annotations.length === 0 ? (
        <p className="text-xs text-slate-500">No polygons on this image yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {annotations.map((annotation, index) => {
            const checked = selectedIds.includes(annotation.id);
            return (
              <label
                key={annotation.id}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
                  checked
                    ? "border-teal-600 bg-teal-50 text-teal-900"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(annotation.id)}
                  className="h-3 w-3 accent-teal-700"
                />
                <span
                  className="h-2 w-2 shrink-0 rounded-full ring-1 ring-slate-200"
                  style={{ backgroundColor: annotation.color }}
                />
                <span className="max-w-24 truncate">{annotation.label || `P${index + 1}`}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
