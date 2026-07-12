"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ImageReviewWorkspace } from "@/components/annotate/ImageReviewWorkspace";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiClient } from "@/lib/ApiClient";
import { ui } from "@/lib/Ui";
import { useAccessToken } from "@/lib/Auth";
import { useAnnotationStore } from "@/store/useAnnotationStore";
import type { AnnotationImage, ImageUploadMeta } from "@/types/Annotation";

export default function AnnotatePage() {
  const queryClient = useQueryClient();
  const token = useAccessToken();
  const { activeImageId, setActiveImageId } = useAnnotationStore();

  const imagesQuery = useQuery({
    queryKey: ["images"],
    queryFn: () => apiClient<AnnotationImage[]>("/images/", { token }),
    enabled: Boolean(token),
  });

  const uploadImages = useMutation({
    mutationFn: async ({ files, meta }: { files: FileList; meta: ImageUploadMeta }) => {
      if (!meta.patient_id && !meta.patient_code && !meta.test_code) {
        throw new Error("At least one patient or test identifier is required.");
      }

      const uploads = Array.from(files).map((file) => {
        const body = new FormData();
        body.append("file", file);
        if (meta.patient_id) body.append("patient_id", meta.patient_id);
        if (meta.patient_code) body.append("patient_code", meta.patient_code);
        if (meta.test_code) body.append("test_code", meta.test_code);
        return apiClient<AnnotationImage>("/images/", {
          method: "POST",
          token,
          body,
        });
      });

      return Promise.all(uploads);
    },
    onSuccess: (images) => {
      void queryClient.invalidateQueries({ queryKey: ["images"] });
      if (images[0]) {
        setActiveImageId(images[0].id);
      }
    },
  });

  useEffect(() => {
    if (!activeImageId && imagesQuery.data?.[0]) {
      setActiveImageId(imagesQuery.data[0].id);
    }
  }, [activeImageId, imagesQuery.data, setActiveImageId]);

  return (
    <AuthGuard>
      <main>
        <PageHeader
          title="Clinical Image Review"
          description="Review image series, annotate findings, and document notes per image and per series."
        />

        {uploadImages.isError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Upload failed. Add patient ID, patient code, or test code before uploading.
          </p>
        ) : null}

        {imagesQuery.isLoading ? (
          <div className={`${ui.card} animate-pulse p-6`}>
            <div className="mb-4 h-6 w-48 rounded-lg bg-slate-200" />
            <div className="mx-auto h-160 max-w-full rounded-xl bg-slate-200" />
          </div>
        ) : (
          <ImageReviewWorkspace
            images={imagesQuery.data ?? []}
            token={token}
            activeImageId={activeImageId}
            onSelectImage={setActiveImageId}
            onUpload={async (files, meta) => {
              await uploadImages.mutateAsync({ files, meta });
            }}
            isUploading={uploadImages.isPending}
          />
        )}
      </main>
    </AuthGuard>
  );
}
