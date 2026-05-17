"use client";

import { useEffect, useRef } from "react";

interface DrawingCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onPointerMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onPointerUp: () => void;
  onResize?: (width: number, height: number) => void;
  readonly?: boolean;
  className?: string;
}

export function DrawingCanvas({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onResize,
  readonly = false,
  className = "",
}: DrawingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      onResize?.(w, h);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [canvasRef, onResize]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-2xl bg-[#0a0a0a] ${className}`}
    >
      <canvas
        ref={canvasRef}
        className={`block w-full h-full ${
          readonly ? "" : "cursor-crosshair touch-none"
        }`}
        onMouseDown={readonly ? undefined : onPointerDown}
        onMouseMove={readonly ? undefined : onPointerMove}
        onMouseUp={readonly ? undefined : onPointerUp}
        onMouseLeave={readonly ? undefined : onPointerUp}
        onTouchStart={readonly ? undefined : onPointerDown}
        onTouchMove={readonly ? undefined : onPointerMove}
        onTouchEnd={readonly ? undefined : onPointerUp}
      />
    </div>
  );
}
