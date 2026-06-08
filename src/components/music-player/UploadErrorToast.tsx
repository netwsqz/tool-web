"use client";

import { X, AlertCircle } from "lucide-react";
import type { UploadError } from "./MusicPlayerContext";

type UploadErrorToastProps = {
  errors: UploadError[];
  onDismiss: (index: number) => void;
};

export function UploadErrorToast({ errors, onDismiss }: UploadErrorToastProps) {
  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm animate-fade-in">
      {errors.map((err, i) => (
        <div
          key={`${err.filename}-${i}`}
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg animate-fade-in"
          style={{
            background: "var(--color-bg-elevated)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid color-mix(in srgb, var(--color-destructive) 25%, var(--color-border))",
          }}
        >
          <AlertCircle className="size-4 shrink-0 mt-0.5" style={{ color: "var(--color-destructive)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>
              {err.filename}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-foreground-muted)" }}>
              {err.error}
            </p>
          </div>
          <button
            onClick={() => onDismiss(i)}
            className="shrink-0 p-1 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
            style={{ color: "var(--color-foreground-subtle)" }}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
