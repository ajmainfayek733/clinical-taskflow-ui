"use client";

import { useEffect } from "react";

export default function AnnotateError({
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
      <h2 className="text-lg font-semibold text-red-800">Image review unavailable</h2>
      <p className="mt-2 text-sm text-red-700">
        The annotation canvas hit an error. You can retry without affecting the task board.
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
