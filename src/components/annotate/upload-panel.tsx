"use client";

import { useState } from "react";

import type { ImageUploadMeta } from "@/types/annotation";
import { ui } from "@/lib/ui";

export function UploadPanel({
  onUpload,
  isUploading,
}: {
  onUpload: (files: FileList, meta: ImageUploadMeta) => Promise<void>;
  isUploading: boolean;
}) {
  const [testCode, setTestCode] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  return (
    <div className={`${ui.cardInset} mb-5 p-5`}>
      <p className={ui.label}>Upload study images</p>
      <p className="mt-1 text-xs text-slate-500">
        Provide test identifier before uploading.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          className={ui.input}
          placeholder="Test code. E.g. TST-1234"
          value={testCode}
          onChange={(event) => setTestCode(event.target.value)}
        />
      </div>
      <label className={`${ui.btnPrimary} mt-4 w-full cursor-pointer sm:w-auto`}>
        {isUploading ? "Uploading..." : "Choose images"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading}
          onChange={async (event) => {
            const files = event.target.files;

            if (!files?.length) {
              return;
            }

            if (!testCode.trim()) {
              setShowWarning(true);
              event.target.value = "";
              return;
            }

            setShowWarning(false);

            try {
              await onUpload(files, {test_code: testCode.trim()});
              setTestCode("");
            } catch {
              setShowWarning(true);
            } finally {
              event.target.value = "";
            }
          }}
        />
      </label>
      {showWarning ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Add test identifier before uploading.
        </p>
      ) : null}
    </div>
  );
}
