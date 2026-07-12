"use client";

import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { MdDragIndicator } from "react-icons/md";

import { priorityLabels, priorityStyles } from "@/lib/TaskStyles";
import { ui } from "@/lib/Ui";
import type { Task } from "@/types/Task";

export function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-400 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 active:cursor-grabbing"
          aria-label={`Drag task: ${task.title}`}
          {...attributes}
          {...listeners}
        >
          <MdDragIndicator size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-slate-900">{task.title}</h3>
              {task.description ? (
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{task.description}</p>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityStyles[task.priority]}`}
            >
              {priorityLabels[task.priority]}
            </span>
          </div>

          {task.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white shadow-sm"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex gap-2">
            <button type="button" className={ui.btnSecondary} onClick={() => onEdit(task)}>
              Edit
            </button>
            <button type="button" className={ui.btnDanger} onClick={() => onDelete(task)}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
