"use client";

import { useState } from "react";

import { ui } from "@/lib/ui";
import type { Tag, Task, TaskPayload, TaskPriority, TaskStatus } from "@/types/task";

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorities: TaskPriority[] = ["low", "medium", "high"];

const emptyForm: TaskPayload = {
  title: "",
  description: "",
  due_date: "",
  priority: "medium",
  status: "todo",
  tag_ids: [],
};

function getInitialForm(date: string, initialStatus: TaskStatus, task: Task | null): TaskPayload {
  if (task) {
    return {
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      priority: task.priority,
      status: task.status,
      tag_ids: task.tags.map((tag) => tag.id),
    };
  }

  return { ...emptyForm, due_date: date, status: initialStatus };
}

export function TaskModal({
  open,
  date,
  initialStatus,
  tags,
  task,
  onClose,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  date: string;
  initialStatus: TaskStatus;
  tags: Tag[];
  task: Task | null;
  onClose: () => void;
  onSubmit: (payload: TaskPayload) => Promise<void>;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<TaskPayload>(() => getInitialForm(date, initialStatus, task));

  if (!open) {
    return null;
  }

  function toggleTag(tagId: number) {
    setForm((current) => ({
      ...current,
      tag_ids: current.tag_ids.includes(tagId)
        ? current.tag_ids.filter((id) => id !== tagId)
        : [...current.tag_ids, tagId],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className={`max-h-[92vh] w-full overflow-y-auto ${ui.card} rounded-t-2xl p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl`}>
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {task ? "Edit clinical task" : "Add clinical task"}
          </h2>
          <button type="button" className={ui.btnGhost} onClick={onClose}>
            Close
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(form);
          }}
        >
          <input
            className={ui.input}
            placeholder="Task title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />

          <textarea
            className={`${ui.textarea} min-h-24`}
            placeholder="Clinical context or instructions"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />

          <div className="grid gap-3 md:grid-cols-3">
            <input
              className={ui.input}
              type="date"
              value={form.due_date}
              onChange={(event) =>
                setForm((current) => ({ ...current, due_date: event.target.value }))
              }
              required
            />

            <select
              className={ui.select}
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as TaskStatus,
                }))
              }
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              className={ui.select}
              value={form.priority}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  priority: event.target.value as TaskPriority,
                }))
              }
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className={`mb-2 ${ui.label}`}>Categories</p>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-sm text-slate-500">No categories available yet.</p>
              ) : (
                tags.map((tag) => {
                  const selected = form.tag_ids.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        selected
                          ? "border-teal-700 bg-teal-700 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-200 hover:bg-teal-50"
                      }`}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" className={ui.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={ui.btnPrimary} disabled={isSaving}>
              {isSaving ? "Saving..." : task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
