"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage } from "react-konva";
import { FaArrowAltCircleLeft, FaArrowAltCircleRight, FaRedo, FaUndo } from "react-icons/fa";

import { UploadPanel } from "@/components/annotate/UploadPanel";
import { ConfirmDialog } from "@/components/annotate/ConfirmDialog";
import { ImageSeriesPanel } from "@/components/annotate/ImageSeriesPanel";
import { ShapeList } from "@/components/annotate/ShapeList";
import { apiClient } from "@/lib/ApiClient";
import { groupImagesBySeries, getSeriesReviewQuery } from "@/lib/ImageSeries";
import { ui } from "@/lib/Ui";
import { useCanvasDisplaySize } from "@/lib/useCanvasDisplaySize";
import {
  getImageLayout,
  getPointerOnCanvas,
  isNearPoint,
  isValidAnnotationPoints,
  toCanvasPoints,
  toImageRelativePoint,
  toNormalizedPoints,
} from "@/lib/CanvasLayout";
import {
  ANNOTATION_CLASSES,
  type Annotation,
  type AnnotationImage,
  type ImageUploadMeta,
  type SeriesReview,
} from "@/types/Annotation";
import { VscCursor, VscEdit } from "react-icons/vsc";
import { MdOutlinePanTool } from "react-icons/md";
import { FiZoomIn, FiZoomOut } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoExpand } from "react-icons/io5";

type ToolMode = "select" | "annotate" | "pan";

const imageCache = new Map<string, HTMLImageElement>();

function useCanvasImage(src?: string) {
  const [prevSrc, setPrevSrc] = useState<string | undefined>(src);
  const [image, setImage] = useState<HTMLImageElement | null>(() => {
    if (src && typeof window !== "undefined" && imageCache.has(src)) {
      return imageCache.get(src)!;
    }
    return null;
  });

  if (src !== prevSrc) {
    setPrevSrc(src);
    if (src && imageCache.has(src)) {
      setImage(imageCache.get(src)!);
    } else {
      setImage(null);
    }
  }

  useEffect(() => {
    if (!src || typeof window === "undefined" || imageCache.has(src)) {
      return;
    }

    const nextImage = new window.Image();
    nextImage.crossOrigin = "anonymous";
    nextImage.src = src;
    nextImage.onload = () => {
      imageCache.set(src, nextImage);
      setImage(nextImage);
    };
  }, [src]);

  return image;
}

function IconButton({
  label,
  active,
  className,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm shadow-sm transition sm:h-10 sm:w-10 ${
        active
          ? "border-teal-600 bg-teal-700 text-white shadow-teal-900/20"
          : "border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
      } ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function DebouncedNoteField({
  label,
  placeholder,
  initialNotes,
  onSave,
  isSaving = false,
}: {
  label: string;
  placeholder: string;
  initialNotes: string;
  onSave: (notes: string) => void;
  isSaving?: boolean;
}) {
  const [note, setNote] = useState(initialNotes);
  const lastSavedRef = useRef(initialNotes);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (note === lastSavedRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastSavedRef.current = note;
      onSaveRef.current(note);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [note]);

  const [prevIsSaving, setPrevIsSaving] = useState(isSaving);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  if (isSaving !== prevIsSaving) {
    setPrevIsSaving(isSaving);
    if (isSaving) {
      setStatus("saving");
    } else if (status === "saving") {
      setStatus("saved");
    }
  }

  useEffect(() => {
    if (status === "saved") {
      const timer = setTimeout(() => setStatus("idle"), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className={ui.label}>{label}</label>
        {status === "saving" && (
          <span className="flex items-center gap-1 text-[10px] text-slate-500">
            <svg
              className="animate-spin h-3 w-3 text-teal-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Saving...</span>
          </span>
        )}
        {status === "saved" && (
          <span className="text-[10px] text-teal-600 font-medium">✓ Saved</span>
        )}
      </div>
      <textarea
        className={ui.textarea}
        placeholder={placeholder}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </div>
  );
}

export function ImageReviewWorkspace({
  images,
  token,
  activeImageId,
  onSelectImage,
  onUpload,
  isUploading,
}: {
  images: AnnotationImage[];
  token: string | null;
  activeImageId: string | null;
  onSelectImage: (id: string) => void;
  onUpload: (files: FileList, meta: ImageUploadMeta) => Promise<void>;
  isUploading: boolean;
}) {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<number | null>(null);

  const [selectedClass, setSelectedClass] = useState<(typeof ANNOTATION_CLASSES)[number]>(
    ANNOTATION_CLASSES[0],
  );
  const [hideAnnotations, setHideAnnotations] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState<string[]>([]);
  const [activeSeriesKey, setActiveSeriesKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draftPoints, setDraftPoints] = useState<number[]>([]);
  const [undoStack, setUndoStack] = useState<number[][]>([]);
  const [redoStack, setRedoStack] = useState<number[][]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showClearSeriesConfirm, setShowClearSeriesConfirm] = useState(false);

  const seriesGroups = useMemo(() => groupImagesBySeries(images), [images]);

  const activeSeries = useMemo(() => {
    if (activeSeriesKey) {
      const found = seriesGroups.find((item) => item.key === activeSeriesKey);
      if (found) {
        return found;
      }
    }

    if (activeImageId) {
      const fromActiveImage = seriesGroups.find((item) =>
        item.images.some((entry) => entry.id === activeImageId),
      );
      if (fromActiveImage) {
        return fromActiveImage;
      }
    }

    return seriesGroups[0] ?? null;
  }, [activeSeriesKey, activeImageId, seriesGroups]);

  const seriesImages = useMemo(() => activeSeries?.images ?? [], [activeSeries]);

  const canvasSize = useCanvasDisplaySize(canvasRef);

  const activeIndex = seriesImages.findIndex((item) => item.id === activeImageId);
  const image = activeIndex >= 0 ? seriesImages[activeIndex] : seriesImages[0];
  const konvaImage = useCanvasImage(image?.file_url);

  const layout = useMemo(
    () => getImageLayout(image?.width ?? 0, image?.height ?? 0, canvasSize),
    [canvasSize, image?.height, image?.width],
  );

  const annotationsQuery = useQuery({
    queryKey: ["annotations", image?.id],
    queryFn: () => apiClient<Annotation[]>(`/images/${image?.id}/annotations/`, { token }),
    enabled: Boolean(token && image?.id),
    staleTime: 5 * 60 * 1000,
  });

  const seriesReviewQueryString = activeSeries ? getSeriesReviewQuery(activeSeries) : "";

  const seriesQuery = useQuery({
    queryKey: ["series-review", activeSeries?.key],
    queryFn: () => apiClient<SeriesReview>(`/series-review/?${seriesReviewQueryString}`, { token }),
    enabled: Boolean(token && activeSeries),
    staleTime: 5 * 60 * 1000,
  });

  // Preload all images in the active series
  useEffect(() => {
    if (typeof window === "undefined" || !seriesImages.length) {
      return;
    }
    seriesImages.forEach((img) => {
      const src = img.file_url;
      if (src && !imageCache.has(src)) {
        const nextImage = new window.Image();
        nextImage.crossOrigin = "anonymous";
        nextImage.src = src;
        nextImage.onload = () => {
          imageCache.set(src, nextImage);
        };
      }
    });
  }, [seriesImages]);

  // Prefetch annotations for all images in the active series
  useEffect(() => {
    if (!token || !seriesImages.length) {
      return;
    }
    seriesImages.forEach((img) => {
      void queryClient.prefetchQuery({
        queryKey: ["annotations", img.id],
        queryFn: () => apiClient<Annotation[]>(`/images/${img.id}/annotations/`, { token }),
        staleTime: 5 * 60 * 1000,
      });
    });
  }, [seriesImages, token, queryClient]);

  const validAnnotations = useMemo(
    () => (annotationsQuery.data ?? []).filter((item) => isValidAnnotationPoints(item.points)),
    [annotationsQuery.data],
  );

  const saveAnnotation = useMutation({
    mutationFn: (points: [number, number][]) =>
      apiClient<Annotation>(`/images/${image?.id}/annotations/`, {
        method: "POST",
        token,
        body: JSON.stringify({
          label: selectedClass.label,
          color: selectedClass.color,
          points,
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["annotations", image?.id] });
      setDraftPoints([]);
      setUndoStack([]);
      setRedoStack([]);
      setStatusMessage("Polygon saved.");
      window.setTimeout(() => setStatusMessage(null), 2000);
    },
    onError: () => {
      setStatusMessage("Could not save polygon. Check login and try again.");
    },
  });

  const deleteSelectedAnnotations = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) => apiClient<void>(`/annotations/${id}/`, { method: "DELETE", token })),
      );
    },
    onSuccess: () => {
      setSelectedAnnotationIds([]);
      void queryClient.invalidateQueries({ queryKey: ["annotations", image?.id] });
      setStatusMessage("Selected polygons deleted.");
      window.setTimeout(() => setStatusMessage(null), 2000);
    },
  });

  const clearImageAnnotations = useMutation({
    mutationFn: () =>
      apiClient<void>(`/images/${image?.id}/annotations/clear/`, { method: "DELETE", token }),
    onSuccess: () => {
      setSelectedAnnotationIds([]);
      void queryClient.invalidateQueries({ queryKey: ["annotations", image?.id] });
    },
  });

  const clearSeriesAnnotations = useMutation({
    mutationFn: () =>
      apiClient<void>(`/series-annotations/clear/?${seriesReviewQueryString}`, {
        method: "DELETE",
        token,
      }),
    onSuccess: () => {
      setSelectedAnnotationIds([]);
      setShowClearSeriesConfirm(false);
      void queryClient.invalidateQueries({ queryKey: ["annotations"] });
      setStatusMessage("All annotations in this series were deleted.");
      window.setTimeout(() => setStatusMessage(null), 2000);
    },
  });

  const saveImageNote = useMutation({
    mutationFn: (notes: string) =>
      apiClient<AnnotationImage>(`/images/${image?.id}/`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["images"] });
    },
  });

  const saveSeriesNote = useMutation({
    mutationFn: (notes: string) =>
      apiClient<SeriesReview>(`/series-review/?${seriesReviewQueryString}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["series-review", activeSeries?.key] });
    },
  });

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function resetDraft() {
    setDraftPoints([]);
    setUndoStack([]);
    setRedoStack([]);
  }

  function toggleAnnotationSelection(id: string) {
    setSelectedAnnotationIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function selectSeries(key: string) {
    const group = seriesGroups.find((item) => item.key === key);
    if (!group) {
      return;
    }

    setActiveSeriesKey(key);
    resetDraft();
    resetView();
    setSelectedAnnotationIds([]);
    onSelectImage(group.images[0].id);
  }

  const goToImage = useCallback(
    (index: number) => {
      const target = seriesImages[index];
      if (target) {
        resetDraft();
        resetView();
        setSelectedAnnotationIds([]);
        onSelectImage(target.id);
      }
    },
    [onSelectImage, seriesImages],
  );

  function pushDraft(next: number[]) {
    setUndoStack((current) => [...current, draftPoints]);
    setRedoStack([]);
    setDraftPoints(next);
  }

  function closeAndAutosave(points: number[]) {
    if (points.length < 6 || saveAnnotation.isPending || !image?.id) {
      return;
    }
    saveAnnotation.mutate(toNormalizedPoints(points, layout));
  }

  function handleStagePointerDown(event: KonvaEventObject<MouseEvent | TouchEvent | PointerEvent>) {
    if (toolMode !== "annotate" || saveAnnotation.isPending) {
      return;
    }

    event.evt.preventDefault();

    const stage = event.target.getStage();
    if (!stage) {
      return;
    }

    const canvasPoint = getPointerOnCanvas(stage, pan, zoom);
    if (!canvasPoint) {
      return;
    }

    const relative = toImageRelativePoint(canvasPoint.x, canvasPoint.y, layout);
    if (!relative) {
      return;
    }

    if (draftPoints.length >= 6) {
      const firstX = draftPoints[0];
      const firstY = draftPoints[1];
      if (isNearPoint(relative.x, relative.y, firstX, firstY, 12 / zoom)) {
        closeAndAutosave(draftPoints);
        return;
      }
    }

    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = window.setTimeout(() => {
      pushDraft([...draftPoints, relative.x, relative.y]);
    }, 180);
  }

  useEffect(() => {
    const node = canvasRef.current;
    if (!node || !seriesImages.length || toolMode === "pan") {
      return;
    }

    function onWheel(event: WheelEvent) {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        setZoom((value) => Math.min(3, Math.max(0.5, value + delta)));
        return;
      }

      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.min(seriesImages.length - 1, Math.max(0, activeIndex + direction));
      if (nextIndex !== activeIndex) {
        goToImage(nextIndex);
      }
    }

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [activeIndex, goToImage, seriesImages.length, toolMode]);

  if (!token) {
    return (
      <div className={`${ui.card} p-6 text-sm text-red-700`}>
        Sign in to review and annotate images.
      </div>
    );
  }

  return (
    <div className={`${ui.card} p-4 md:p-6`}>
      <UploadPanel onUpload={onUpload} isUploading={isUploading} />

      {images.length === 0 ? (
        <p className={ui.emptyState}>
          No images yet. Upload a study using patient or test identifiers above.
        </p>
      ) : (
        <>
          <ImageSeriesPanel
            series={seriesGroups}
            activeKey={activeSeries?.key ?? null}
            onSelect={selectSeries}
          />

          {seriesImages.length === 0 ? (
            <p className={ui.emptyState}>Select an image series to begin review.</p>
          ) : (
            <>
              <div
                className={`${ui.cardInset} mb-4 flex items-center justify-between gap-2 p-3 sm:gap-3`}
              >
                <button
                  type="button"
                  title="Go to Previous Image"
                  aria-label="Previous Image"
                  className={`${ui.btnSecondary} shrink-0 px-2.5! py-2!`}
                  disabled={activeIndex <= 0}
                  onClick={() => goToImage(activeIndex - 1)}
                >
                  <FaArrowAltCircleLeft size={20} />
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="text-base font-semibold text-slate-900 sm:text-lg">
                    Images ({Math.max(activeIndex, 0) + 1}/{seriesImages.length})
                  </p>
                  <p className="truncate text-xs text-slate-500">{image?.original_name}</p>
                  <p className="truncate text-xs text-teal-700/80">{activeSeries?.label}</p>
                </div>
                <button
                  type="button"
                  title="Go to Next Image"
                  aria-label="Next Image"
                  className={`${ui.btnSecondary} shrink-0 px-2.5! py-2!`}
                  disabled={activeIndex >= seriesImages.length - 1}
                  onClick={() => goToImage(activeIndex + 1)}
                >
                  <FaArrowAltCircleRight size={20} />
                </button>
              </div>

              <div
                className={`${ui.cardInset} mb-4 flex flex-col gap-3 p-4 text-sm sm:flex-row sm:flex-wrap sm:items-center`}
              >
                <label className="flex w-full items-center gap-2 sm:w-auto">
                  <span className={`shrink-0 ${ui.label}`}>Class</span>
                  <select
                    className={`${ui.select} w-full sm:w-auto`}
                    value={selectedClass.label}
                    onChange={(event) => {
                      const next = ANNOTATION_CLASSES.find(
                        (item) => item.label === event.target.value,
                      );
                      if (next) {
                        setSelectedClass(next);
                      }
                    }}
                  >
                    {ANNOTATION_CLASSES.map((item) => (
                      <option key={item.label} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hideAnnotations}
                    onChange={(event) => setHideAnnotations(event.target.checked)}
                  />
                  Hide annotation
                </label>

                <button
                  type="button"
                  className={`${ui.btnDanger} w-full sm:w-auto`}
                  onClick={() => clearImageAnnotations.mutate()}
                >
                  <span className="sm:hidden">Clear image annotations</span>
                  <span className="hidden sm:inline">Delete annotation (current image)</span>
                </button>

                <button
                  type="button"
                  className={`${ui.btnDanger} w-full sm:w-auto`}
                  disabled={!activeSeries || clearSeriesAnnotations.isPending}
                  onClick={() => setShowClearSeriesConfirm(true)}
                >
                  <span className="sm:hidden">Clear series annotations</span>
                  <span className="hidden sm:inline">Delete all annotations (current series)</span>
                </button>
              </div>

              <div
                ref={canvasRef}
                className={`mx-auto aspect-square w-full max-w-160 overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-200 shadow-inner touch-none ${
                  toolMode === "pan"
                    ? "cursor-grab"
                    : toolMode === "annotate"
                      ? "cursor-crosshair"
                      : "cursor-default"
                }`}
              >
                <Stage
                  width={canvasSize}
                  height={canvasSize}
                  style={{ touchAction: "none" }}
                  onPointerDown={handleStagePointerDown}
                >
                  <Layer>
                    <Group
                      x={pan.x}
                      y={pan.y}
                      scaleX={zoom}
                      scaleY={zoom}
                      draggable={toolMode === "pan"}
                      onDragEnd={(event) => setPan({ x: event.target.x(), y: event.target.y() })}
                    >
                      <Rect x={0} y={0} width={canvasSize} height={canvasSize} fill="#E2E8F0" />

                      {konvaImage ? (
                        <KonvaImage
                          image={konvaImage}
                          x={layout.x}
                          y={layout.y}
                          width={layout.width}
                          height={layout.height}
                        />
                      ) : null}

                      {!hideAnnotations
                        ? validAnnotations.map((annotation) => (
                            <Line
                              key={annotation.id}
                              points={toCanvasPoints(annotation.points, layout)}
                              closed
                              stroke={
                                selectedAnnotationIds.includes(annotation.id)
                                  ? "#0F172A"
                                  : annotation.color
                              }
                              strokeWidth={
                                selectedAnnotationIds.includes(annotation.id) ? 3 / zoom : 2 / zoom
                              }
                              fill={`${annotation.color}33`}
                              onClick={(event) => {
                                if (toolMode !== "select") {
                                  return;
                                }
                                event.cancelBubble = true;
                                toggleAnnotationSelection(annotation.id);
                              }}
                              onTap={(event) => {
                                if (toolMode !== "select") {
                                  return;
                                }
                                event.cancelBubble = true;
                                toggleAnnotationSelection(annotation.id);
                              }}
                            />
                          ))
                        : null}

                      {draftPoints.length >= 2 ? (
                        <Group>
                          <Line
                            points={draftPoints.flatMap((value, index) =>
                              index % 2 === 0
                                ? [layout.x + value, layout.y + draftPoints[index + 1]]
                                : [],
                            )}
                            stroke={selectedClass.color}
                            strokeWidth={2 / zoom}
                            closed={false}
                          />
                          {draftPoints.map((value, index) =>
                            index % 2 === 0 ? (
                              <Circle
                                key={`${value}-${draftPoints[index + 1]}`}
                                x={layout.x + value}
                                y={layout.y + draftPoints[index + 1]}
                                radius={index === 0 ? 6 / zoom : 4 / zoom}
                                fill={selectedClass.color}
                                stroke={
                                  index === 0 && draftPoints.length >= 6 ? "#FFFFFF" : undefined
                                }
                                strokeWidth={index === 0 && draftPoints.length >= 6 ? 2 / zoom : 0}
                              />
                            ) : null,
                          )}
                        </Group>
                      ) : null}
                    </Group>
                  </Layer>
                </Stage>
              </div>

              {statusMessage ? (
                <p className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-center text-sm font-medium text-teal-900">
                  {statusMessage}
                </p>
              ) : null}

              <div className="mt-3 flex flex-col items-center px-2">
                <input
                  type="range"
                  min={0}
                  max={Math.max(seriesImages.length - 1, 0)}
                  value={Math.max(activeIndex, 0)}
                  onChange={(event) => goToImage(Number(event.target.value))}
                  className="h-1 w-full max-w-xs cursor-pointer accent-teal-700 sm:w-40"
                />
                <p className="mt-1 text-center text-xs text-slate-500">
                  Scroll to change image · Ctrl+scroll to zoom
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <IconButton
                  label="Select"
                  active={toolMode === "select"}
                  onClick={() => {
                    setToolMode("select");
                    resetDraft();
                  }}
                >
                  <VscCursor size={20} />
                </IconButton>
                <IconButton
                  label="Annotate"
                  active={toolMode === "annotate"}
                  onClick={() => {
                    setToolMode("annotate");
                    setSelectedAnnotationIds([]);
                  }}
                >
                  <VscEdit size={20} />
                </IconButton>
                <IconButton
                  label="Pan"
                  active={toolMode === "pan"}
                  onClick={() => {
                    setToolMode("pan");
                    resetDraft();
                  }}
                >
                  <MdOutlinePanTool size={20} />
                </IconButton>
                <IconButton
                  label="Zoom in"
                  onClick={() => setZoom((value) => Math.min(3, value + 0.1))}
                >
                  <FiZoomIn size={20} />
                </IconButton>
                <IconButton
                  label="Zoom out"
                  onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
                >
                  <FiZoomOut size={20} />
                </IconButton>
                <IconButton label="Reset view" onClick={resetView}>
                  <IoExpand size={20} />
                </IconButton>
                <IconButton
                  label="Undo"
                  onClick={() => {
                    if (!undoStack.length) {
                      return;
                    }
                    const previous = undoStack[undoStack.length - 1];
                    setRedoStack((current) => [...current, draftPoints]);
                    setDraftPoints(previous);
                    setUndoStack((current) => current.slice(0, -1));
                  }}
                >
                  <FaUndo size={16} />
                </IconButton>
                <IconButton
                  label="Redo"
                  onClick={() => {
                    if (!redoStack.length) {
                      return;
                    }
                    const next = redoStack[redoStack.length - 1];
                    setUndoStack((current) => [...current, draftPoints]);
                    setDraftPoints(next);
                    setRedoStack((current) => current.slice(0, -1));
                  }}
                >
                  <FaRedo size={16} />
                </IconButton>
                <IconButton
                  label="Clear draft"
                  className="hover:bg-red-50 hover:text-red-600"
                  onClick={() => pushDraft([])}
                >
                  <RiDeleteBin6Line size={20} />
                </IconButton>
              </div>

              <div className="mt-4">
                <ShapeList
                  annotations={validAnnotations}
                  selectedIds={selectedAnnotationIds}
                  onToggle={toggleAnnotationSelection}
                  onDeleteSelected={() => deleteSelectedAnnotations.mutate(selectedAnnotationIds)}
                  isDeleting={deleteSelectedAnnotations.isPending}
                />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {image ? (
                  <DebouncedNoteField
                    key={image.id}
                    label="Note"
                    placeholder="Notes for currently viewed image"
                    initialNotes={image.notes ?? ""}
                    onSave={(notes) => saveImageNote.mutate(notes)}
                    isSaving={saveImageNote.isPending}
                  />
                ) : null}
                <DebouncedNoteField
                  key={
                    activeSeries
                      ? `${activeSeries.key}-${seriesQuery.isFetched ? "loaded" : "loading"}`
                      : "series"
                  }
                  label="Series review"
                  placeholder={
                    seriesQuery.isLoading ? "Loading series review..." : "Notes for whole series"
                  }
                  initialNotes={seriesQuery.data?.notes ?? ""}
                  onSave={(notes) => saveSeriesNote.mutate(notes)}
                  isSaving={saveSeriesNote.isPending}
                />
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Annotate: place at least 3 points, then click the first point to close and save.
                Select polygons with checkboxes or on canvas, then use the delete icon.
              </p>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={showClearSeriesConfirm}
        title="Delete all series annotations?"
        message={
          activeSeries
            ? `This will permanently remove every polygon saved for "${activeSeries.label}". Other series will not be affected.`
            : "This will permanently remove every polygon in the current series."
        }
        confirmLabel="Delete series annotations"
        isLoading={clearSeriesAnnotations.isPending}
        onConfirm={() => clearSeriesAnnotations.mutate()}
        onCancel={() => setShowClearSeriesConfirm(false)}
      />
    </div>
  );
}
