"use client";

import { type RefObject, useEffect, useState } from "react";

import { CANVAS_SIZE } from "@/lib/canvas-layout";

export function useCanvasDisplaySize(containerRef: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState(CANVAS_SIZE);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    function updateSize() {
      const width = Math.floor(node?.clientWidth ?? CANVAS_SIZE);
      setSize(Math.min(CANVAS_SIZE, Math.max(240, width)));
    }

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, [containerRef]);

  return size;
}
