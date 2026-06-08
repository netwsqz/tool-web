"use client";

import type { DrawingTool } from "@/lib/draw-guess/types";
import { ColorPicker } from "./ColorPicker";

interface ToolBarProps {
  tool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  color: string;
  onColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
  disabled?: boolean;
}

export function ToolBar({
  tool,
  onToolChange,
  color,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  onUndo,
  onClear,
  canUndo,
  disabled = false,
}: ToolBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Pen / Eraser */}
      <div className="flex rounded-xl bg-black/5 p-1 gap-0.5">
        <button
          type="button"
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            tool === "pen"
              ? "bg-black/10 text-[var(--color-foreground)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]"
          }`}
          onClick={() => onToolChange("pen")}
        >
          画笔
        </button>
        <button
          type="button"
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            tool === "eraser"
              ? "bg-black/10 text-[var(--color-foreground)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]"
          }`}
          onClick={() => onToolChange("eraser")}
        >
          橡皮
        </button>
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-6 bg-black/10" />

      {/* Colors */}
      <ColorPicker color={color} onChange={onColorChange} />

      {/* Divider */}
      <div className="hidden sm:block w-px h-6 bg-black/10" />

      {/* Brush size */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {brushSize}px
        </span>
        <input
          type="range"
          min="1"
          max="30"
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          disabled={disabled}
          aria-label="画笔大小"
          className="w-20 h-1 accent-[var(--color-accent)] cursor-pointer"
        />
      </div>

      {/* Divider */}
      <div className="hidden sm:block w-px h-6 bg-black/10" />

      {/* Actions */}
      <div className="flex gap-1">
        <button
          type="button"
          disabled={disabled || !canUndo}
          className="px-3 py-1.5 rounded-lg text-xs font-medium
            text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          onClick={onUndo}
        >
          撤销
        </button>
        <button
          type="button"
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg text-xs font-medium
            text-[var(--color-destructive)] hover:text-[var(--color-destructive)]
            disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          onClick={onClear}
        >
          清空
        </button>
      </div>
    </div>
  );
}
