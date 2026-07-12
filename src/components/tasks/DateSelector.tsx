"use client";

import { ui } from "@/lib/Ui";
import { useDateStore } from "@/store/useDateStore";

export function DateSelector() {
  const { selectedDate, setSelectedDate } = useDateStore();
  return (
    <div className={`${ui.card} mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}>
      <div>
        <label htmlFor="task-date" className={ui.label}>
          Selected date
        </label>
        <p className="mt-0.5 text-xs text-slate-500">Tasks shown below match this calendar day.</p>
      </div>
      <input
        id="task-date"
        type="date"
        value={selectedDate}
        onChange={(event) => setSelectedDate(event.target.value)}
        className={`${ui.input} w-full sm:w-auto`}
      />
    </div>
  );
}
