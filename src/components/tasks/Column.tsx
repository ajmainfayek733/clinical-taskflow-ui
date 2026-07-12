"use client";

import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { TaskCard } from "@/components/tasks/TaskCard";
import { ui } from "@/lib/Ui";
import type { Task, TaskStatus } from "@/types/Task";

type ColumnProps = {
  column: { key: TaskStatus; title: string; accent: string };
  tasks: Task[];
  onAdd: (status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

function ColumnDropZone({ status, children }: { status: TaskStatus; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 space-y-2 rounded border border-dashed p-2 ${
        isOver ? "border-slate-700 bg-slate-50" : "border-transparent"
      }`}
    >
      {children}
    </div>
  );
}

export function Column({ column, tasks, onAdd, onEdit, onDelete }: ColumnProps) {
  return (
    <section className={`${ui.card} border-t-4 ${column.accent} p-4`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{column.title}</h2>
        <button
          type="button"
          className={`${ui.btnGhost} px-2! py-1! text-xs`}
          onClick={() => onAdd(column.key)}
        >
          + Add
        </button>
      </div>

      <SortableContext items={tasks.map((task) => task.id)} strategy={rectSortingStrategy}>
        <ColumnDropZone status={column.key}>
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center">
              <p className="text-sm text-slate-500">Nothing here yet.</p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-teal-700 hover:text-teal-800"
                onClick={() => onAdd(column.key)}
              >
                Add a task
              </button>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </ColumnDropZone>
      </SortableContext>
    </section>
  );
}
