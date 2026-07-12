"use client";

import type { ImageSeries } from "@/lib/ImageSeries";
import { ui } from "@/lib/Ui";

export function ImageSeriesPanel({
  series,
  activeKey,
  onSelect,
}: {
  series: ImageSeries[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}) {
  if (series.length === 0) {
    return null;
  }

  return (
    <div className={`${ui.card} mb-5 p-4`}>
      <h2 className={ui.label}>Available image series</h2>
      <p className="mt-0.5 text-xs text-slate-500">Select a series to load its images in the canvas.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {series.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`rounded-xl border px-3.5 py-2 text-left text-xs transition ${
              activeKey === item.key
                ? "border-teal-600 bg-teal-700 text-white shadow-sm shadow-teal-900/20"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50"
            }`}
          >
            <p className="font-medium">{item.label}</p>
            <p className={activeKey === item.key ? "text-teal-100" : "text-slate-500"}>
              {item.images.length} image{item.images.length === 1 ? "" : "s"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
