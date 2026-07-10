import type { AnnotationImage } from "@/types/annotation";

export interface ImageSeries {
  key: string;
  label: string;
  patient_id: string;
  patient_code: string;
  test_code: string;
  images: AnnotationImage[];
}

export function getSeriesKey(image: AnnotationImage): string {
  return `${image.patient_id}|${image.patient_code}|${image.test_code}`;
}

export function getSeriesLabel(image: AnnotationImage): string {
  const parts = [
    image.patient_id && `ID: ${image.patient_id}`,
    image.patient_code && `Code: ${image.patient_code}`,
    image.test_code && `Test: ${image.test_code}`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Unlabeled series";
}

export function groupImagesBySeries(images: AnnotationImage[]): ImageSeries[] {
  const map = new Map<string, ImageSeries>();

  for (const image of images) {
    const key = getSeriesKey(image);
    const existing = map.get(key);

    if (existing) {
      existing.images.push(image);
      continue;
    }

    map.set(key, {
      key,
      label: getSeriesLabel(image),
      patient_id: image.patient_id,
      patient_code: image.patient_code,
      test_code: image.test_code,
      images: [image],
    });
  }

  return Array.from(map.values());
}

export function getSeriesReviewQuery(series: Pick<ImageSeries, "patient_id" | "patient_code" | "test_code">) {
  const params = new URLSearchParams({
    patient_id: series.patient_id,
    patient_code: series.patient_code,
    test_code: series.test_code,
  });
  return params.toString();
}
