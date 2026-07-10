export const CANVAS_SIZE = 640;

export interface ImageLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getImageLayout(
  imageWidth: number,
  imageHeight: number,
  canvasSize = CANVAS_SIZE,
): ImageLayout {
  if (!imageWidth || !imageHeight) {
    return { x: 0, y: 0, width: canvasSize, height: canvasSize };
  }

  const scale = Math.min(canvasSize / imageWidth, canvasSize / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;

  return {
    x: (canvasSize - width) / 2,
    y: (canvasSize - height) / 2,
    width,
    height,
  };
}

export function toNormalizedPoints(
  points: number[],
  layout: ImageLayout,
): [number, number][] {
  const normalized: [number, number][] = [];
  for (let index = 0; index < points.length; index += 2) {
    const x = Math.min(1, Math.max(0, points[index] / layout.width));
    const y = Math.min(1, Math.max(0, points[index + 1] / layout.height));
    normalized.push([x, y]);
  }
  return normalized;
}

export function isValidAnnotationPoints(points: unknown): points is [number, number][] {
  if (!Array.isArray(points) || points.length < 3) {
    return false;
  }
  return points.every(
    (point) =>
      Array.isArray(point) &&
      point.length === 2 &&
      typeof point[0] === "number" &&
      typeof point[1] === "number" &&
      point[0] >= 0 &&
      point[0] <= 1 &&
      point[1] >= 0 &&
      point[1] <= 1,
  );
}

export function getPointerOnCanvas(
  stage: { getPointerPosition: () => { x: number; y: number } | null },
  pan: { x: number; y: number },
  zoom: number,
) {
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    return null;
  }
  return {
    x: (pointer.x - pan.x) / zoom,
    y: (pointer.y - pan.y) / zoom,
  };
}

export function toCanvasPoints(points: [number, number][], layout: ImageLayout): number[] {
  return points.flatMap(([x, y]) => [
    layout.x + x * layout.width,
    layout.y + y * layout.height,
  ]);
}

export function toImageRelativePoint(
  canvasX: number,
  canvasY: number,
  layout: ImageLayout,
): { x: number; y: number } | null {
  const x = canvasX - layout.x;
  const y = canvasY - layout.y;
  if (x < 0 || y < 0 || x > layout.width || y > layout.height) {
    return null;
  }
  return { x, y };
}

export function isNearPoint(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  threshold = 10,
): boolean {
  return Math.hypot(ax - bx, ay - by) <= threshold;
}
