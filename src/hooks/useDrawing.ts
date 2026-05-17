"use client";

import { useRef, useState, useCallback } from "react";
import type { DrawingStroke, Point, DrawingTool } from "@/lib/draw-guess/types";

interface UseDrawingOptions {
  onStroke?: (stroke: DrawingStroke) => void;
  onUndo?: () => void;
  onClear?: () => void;
  readonly?: boolean;
}

export function useDrawing(options: UseDrawingOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);
  const [strokeCount, setStrokeCount] = useState(0);

  // Refs to avoid stale closures in pointer handlers
  const isDrawingRef = useRef(false);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);
  const readonlyRef = useRef(options.readonly);
  const callbacksRef = useRef(options);
  // Keep refs in sync
  toolRef.current = tool;
  colorRef.current = color;
  brushSizeRef.current = brushSize;
  readonlyRef.current = options.readonly;
  callbacksRef.current = options;

  const strokesRef = useRef<DrawingStroke[]>([]);
  const remoteStrokesRef = useRef<DrawingStroke[]>([]);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ("touches" in e) {
        const touch = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  /** Full redraw of all strokes (used on undo/clear/resize) */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = [
      ...strokesRef.current,
      ...remoteStrokesRef.current,
    ];

    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.strokeStyle = stroke.color;
      }
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
  }, []);

  /** Draw a single segment (used on mousemove — no full redraw) */
  const drawSegment = useCallback(
    (from: Point, to: Point, stroke: DrawingStroke) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.strokeStyle = stroke.color;
      }
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    },
    []
  );

  // ─── Pointer handlers (all use refs — never stale) ──────────

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (readonlyRef.current) return;
      const pos = getPos(e);
      if (!pos) return;
      isDrawingRef.current = true;
      currentStrokeRef.current = {
        points: [pos],
        color: colorRef.current,
        width: brushSizeRef.current,
        tool: toolRef.current,
      };
    },
    [getPos]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const pos = getPos(e);
      if (!pos) return;
      const stroke = currentStrokeRef.current;
      const lastPoint = stroke.points[stroke.points.length - 1];
      stroke.points.push(pos);
      // Draw incrementally — no full redraw
      drawSegment(lastPoint, pos, stroke);
    },
    [getPos, drawSegment]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    if (stroke.points.length > 1) {
      strokesRef.current = [...strokesRef.current, stroke];
      setStrokeCount(strokesRef.current.length);
      callbacksRef.current.onStroke?.(stroke);
    }
    currentStrokeRef.current = null;
  }, []);

  // ─── Actions ─────────────────────────────────────────────

  const undo = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    callbacksRef.current.onUndo?.();
    redraw();
  }, [redraw]);

  const clear = useCallback(() => {
    strokesRef.current = [];
    remoteStrokesRef.current = [];
    setStrokeCount(0);
    callbacksRef.current.onClear?.();
    redraw();
  }, [redraw]);

  // ─── Remote sync ─────────────────────────────────────────

  const addRemoteStroke = useCallback(
    (stroke: DrawingStroke) => {
      remoteStrokesRef.current = [...remoteStrokesRef.current, stroke];
      redraw();
    },
    [redraw]
  );

  const remoteUndo = useCallback(() => {
    remoteStrokesRef.current = remoteStrokesRef.current.slice(0, -1);
    redraw();
  }, [redraw]);

  const remoteClear = useCallback(() => {
    strokesRef.current = [];
    remoteStrokesRef.current = [];
    setStrokeCount(0);
    redraw();
  }, [redraw]);

  // ─── Resize ──────────────────────────────────────────────

  const handleResize = useCallback(
    (width: number, height: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const prevW = canvas.width;
      const prevH = canvas.height;
      if (width === prevW && height === prevH) return;
      // Grab a snapshot before resize clears the canvas
      let snapshot: ImageData | null = null;
      if (prevW > 0 && prevH > 0) {
        try {
          snapshot = canvas
            .getContext("2d")
            ?.getImageData(0, 0, prevW, prevH) ?? null;
        } catch {
          // cross-origin or tainted — skip snapshot
        }
      }
      canvas.width = width;
      canvas.height = height;
      if (snapshot) {
        canvas.getContext("2d")?.putImageData(snapshot, 0, 0);
      } else {
        redraw();
      }
    },
    [redraw]
  );

  return {
    canvasRef,
    tool,
    setTool,
    color,
    setColor,
    brushSize,
    setBrushSize,
    strokeCount,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    clear,
    handleResize,
    addRemoteStroke,
    remoteUndo,
    remoteClear,
  };
}
