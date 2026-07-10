"use client";

import { useEffect } from "react";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800">Task board unavailable</h2>
      <p className="mt-2 text-sm text-red-700">
        Something went wrong while loading tasks. Your other modules are still available.
      </p>
      <button
        type="button"
        className="mt-4 rounded-md bg-red-800 px-4 py-2 text-sm text-white"
        onClick={reset}
      >
        Try again
      </button>
    </div>
  );
}
