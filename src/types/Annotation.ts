export interface AnnotationImage {
  id: string;
  file: string;
  file_url: string;
  original_name: string;
  patient_id: string;
  patient_code: string;
  test_code: string;
  width: number;
  height: number;
  notes: string;
  uploaded_at: string;
}

export interface ImageUploadMeta {
  patient_id?: string;
  patient_code?: string;
  test_code: string;
}

export interface Annotation {
  id: string;
  image: string;
  label: string;
  color: string;
  points: [number, number][];
}

export interface SeriesReview {
  patient_id: string;
  patient_code: string;
  test_code: string;
  notes: string;
  updated_at: string;
}

export const ANNOTATION_CLASSES = [
  { label: "Lesion", color: "#DC2626" },
  { label: "Normal", color: "#16A34A" },
  { label: "Follow-up", color: "#2563EB" },
  { label: "Artifact", color: "#CA8A04" },
  { label: "Other", color: "#64748B" },
] as const;
