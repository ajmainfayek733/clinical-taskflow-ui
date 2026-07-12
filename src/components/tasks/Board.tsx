"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { apiClient } from "@/lib/ApiClient";
import { ui } from "@/lib/Ui";
import { BoardSkeleton } from "@/components/tasks/BoardSkeleton";
import { Column } from "@/components/tasks/Column";
import { TaskModal } from "@/components/tasks/TaskModal";
import type { Tag, Task, TaskPayload, TaskStatus } from "@/types/Task";

const columns: { key: TaskStatus; title: string; accent: string }[] = [
  { key: "todo", title: "To Do", accent: "border-t-slate-400" },
  { key: "in_progress", title: "In Progress", accent: "border-t-amber-400" },
  { key: "done", title: "Done", accent: "border-t-emerald-500" },
];

export function Board({ date, token }: { date: string; token: string | null }) {
  const queryClient = useQueryClient();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>("todo");
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["tasks", date],
    queryFn: () => apiClient<Task[]>(`/tasks/?due_date=${date}`, { token }),
    enabled: Boolean(token),
  });
  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => apiClient<Tag[]>("/tags/", { token }),
    enabled: Boolean(token),
  });

  const createTask = useMutation({
    mutationFn: (payload: TaskPayload) =>
      apiClient<Task>("/tasks/", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", date] });
      setIsModalOpen(false);
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaskPayload }) =>
      apiClient<Task>(`/tasks/${id}/`, {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", date] });
      setIsModalOpen(false);
      setActiveTask(null);
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: string) =>
      apiClient<void>(`/tasks/${id}/`, {
        method: "DELETE",
        token,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", date] });
    },
  });

  const reorderTasks = useMutation({
    mutationFn: (tasks: Pick<Task, "id" | "status" | "order">[]) =>
      apiClient<{ ok: boolean }>("/tasks/reorder/", {
        method: "PATCH",
        token,
        body: JSON.stringify({ tasks }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", date] });
    },
  });

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  if (!token) {
    return (
      <div className={`${ui.card} p-6 text-sm text-red-700`}>
        Sign in to view and manage your clinical tasks.
      </div>
    );
  }
  if (tasksQuery.isLoading) return <BoardSkeleton />;
  if (tasksQuery.isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Unable to load tasks for this date. Please refresh or try another day.
      </div>
    );
  }

  function getColumnTasks(status: TaskStatus) {
    return tasks
      .filter((task) => task.status === status)
      .sort((left, right) => left.order - right.order);
  }

  async function handleSubmit(payload: TaskPayload) {
    if (activeTask) {
      await updateTask.mutateAsync({ id: activeTask.id, payload });
      return;
    }
    await createTask.mutateAsync(payload);
  }

  function openCreateModal(status?: TaskStatus) {
    setInitialStatus(status ?? "todo");
    setActiveTask(null);
    setIsModalOpen(true);
  }

  function openDeleteModal(task: Task) {
    setTaskToDelete(task);
  }

  function closeDeleteModal() {
    setTaskToDelete(null);
  }

  async function handleDeleteConfirm() {
    if (!taskToDelete) {
      return;
    }

    await deleteTask.mutateAsync(taskToDelete.id);
    closeDeleteModal();
  }

  function getTaskById(id: string) {
    return tasks.find((task) => task.id === id);
  }

  function buildReorderPayload(allTasks: Task[]) {
    return columns.flatMap((column) =>
      allTasks
        .filter((task) => task.status === column.key)
        .sort((left, right) => left.order - right.order)
        .map((task, index) => ({
          id: task.id,
          status: column.key,
          order: index,
        })),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingTask(null);
    setReorderError(null);
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId) {
      return;
    }

    const sourceTask = getTaskById(activeId);
    if (!sourceTask) {
      return;
    }

    const targetTask = getTaskById(overId);
    const targetStatus =
      targetTask?.status ??
      columns.find((column) => column.key === overId)?.key ??
      sourceTask.status;

    const sourceColumn = getColumnTasks(sourceTask.status);
    const targetColumn = getColumnTasks(targetStatus);

    let nextTasks = [...tasks];

    if (sourceTask.status === targetStatus && targetTask) {
      const oldIndex = sourceColumn.findIndex((task) => task.id === sourceTask.id);
      const newIndex = sourceColumn.findIndex((task) => task.id === targetTask.id);
      const reordered = arrayMove(sourceColumn, oldIndex, newIndex).map((task, index) => ({
        ...task,
        order: index,
      }));
      nextTasks = tasks.filter((task) => task.status !== sourceTask.status).concat(reordered);
    } else {
      const sourceWithoutMoved = sourceColumn.filter((task) => task.id !== sourceTask.id);
      const insertIndex = targetTask
        ? targetColumn.findIndex((task) => task.id === targetTask.id)
        : targetColumn.length;
      const nextTarget = [...targetColumn];
      nextTarget.splice(insertIndex, 0, { ...sourceTask, status: targetStatus });

      nextTasks = tasks
        .filter((task) => task.status !== sourceTask.status && task.status !== targetStatus)
        .concat(
          sourceWithoutMoved.map((task, index) => ({ ...task, order: index })),
          nextTarget.map((task, index) => ({ ...task, order: index, status: targetStatus })),
        );
    }

    queryClient.setQueryData<Task[]>(["tasks", date], nextTasks);
    reorderTasks.mutate(buildReorderPayload(nextTasks), {
      onError: () => {
        queryClient.setQueryData(["tasks", date], tasks);
        setReorderError("Could not save task order. Changes were rolled back.");
      },
    });
  }

  function handleDragStart(activeId: string) {
    const task = getTaskById(activeId);
    if (task) {
      setDraggingTask(task);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Drag cards between columns to update workflow stage.
        </p>
        <button type="button" className={ui.btnPrimary} onClick={() => openCreateModal("todo")}>
          Add clinical task
        </button>
      </div>

      {reorderError ? (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {reorderError}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(event) => handleDragStart(String(event.active.id))}
        onDragEnd={handleDragEnd}
        
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {columns.map((column) => {
            const columnTasks = getColumnTasks(column.key);
            return (
              <Column
                key={column.key}
                column={column}
                tasks={columnTasks}
                onAdd={openCreateModal}
                onEdit={(selectedTask) => {
                  setInitialStatus(selectedTask.status);
                  setActiveTask(selectedTask);
                  setIsModalOpen(true);
                }}
                onDelete={openDeleteModal}
              />
            );
          })}
        </div>

        <DragOverlay>
          {draggingTask ? (
            <div className={`${ui.card} rotate-1 p-4 shadow-lg ring-2 ring-teal-500/20`}>
              <p className="font-medium text-slate-900">{draggingTask.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {taskToDelete ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className={`${ui.card} w-full max-w-md rounded-2xl p-6 shadow-2xl`}>
            <h3 className="text-lg font-semibold text-slate-900">Delete task?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This will permanently remove{" "}
              <span className="font-medium text-slate-900">{taskToDelete.title}</span> from this
              day’s board.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={ui.btnSecondary} onClick={closeDeleteModal}>
                Cancel
              </button>
              <button
                type="button"
                className={ui.btnDanger}
                onClick={handleDeleteConfirm}
                disabled={deleteTask.isPending}
              >
                {deleteTask.isPending ? "Deleting..." : "Delete task"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <TaskModal
        key={`${date}-${initialStatus}-${activeTask?.id ?? "new"}-${isModalOpen ? "open" : "closed"}`}
        open={isModalOpen}
        date={date}
        initialStatus={initialStatus}
        tags={tagsQuery.data ?? []}
        task={activeTask}
        onClose={() => {
          setIsModalOpen(false);
          setActiveTask(null);
        }}
        onSubmit={handleSubmit}
        isSaving={createTask.isPending || updateTask.isPending}
      />
    </>
  );
}
