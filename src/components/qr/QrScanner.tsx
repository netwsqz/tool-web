"use client";

import { useRef, useState } from "react";
import { Upload, Copy, Check } from "lucide-react";

interface QrScannerProps {
  scanning: boolean;
  scannedText: string | null;
  scanError: string | null;
  onScan: (file: File) => void;
  onReset: () => void;
}

export function QrScanner({ scanning, scannedText, scanError, onScan, onReset }: QrScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onReset();
    onScan(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleCopy = async () => {
    if (!scannedText) return;
    await navigator.clipboard.writeText(scannedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Drop zone or result */}
      {!scannedText && !scanError && (
        <div
          role="button"
          tabIndex={scanning ? -1 : 0}
          aria-label="上传二维码图片"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !scanning) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border-2 border-dashed border-[var(--color-border)] cursor-pointer transition-colors hover:border-[var(--color-accent)]/40 ${
            scanning ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {scanning ? (
            <div className="size-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="size-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                <Upload className="size-6 text-[var(--color-accent)]" />
              </div>
              <p className="text-sm text-[var(--color-foreground-muted)]">
                点击或拖拽上传二维码图片
              </p>
              <p className="text-xs text-[var(--color-foreground-subtle)]">
                支持 PNG / JPG / WebP
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Scan error */}
      {scanError && (
        <div className="flex flex-col items-center gap-4 py-12 rounded-2xl border border-[var(--color-border)]">
          <div className="size-12 rounded-xl bg-[var(--color-destructive)]/20 flex items-center justify-center">
            <Upload className="size-6 text-[var(--color-destructive)]" />
          </div>
          <p className="text-sm text-[var(--color-destructive)]">{scanError}</p>
          <button
            type="button"
            onClick={() => { onReset(); inputRef.current?.click(); }}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            重新选择
          </button>
        </div>
      )}

      {/* Scan result */}
      {scannedText && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-black/5 border border-[var(--color-border)] p-4">
            <p className="text-xs text-[var(--color-foreground-subtle)] mb-2">解码结果</p>
            <p className="text-sm text-[var(--color-foreground)] break-all select-all whitespace-pre-wrap">
              {scannedText}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-accent)]/15 text-[var(--color-accent)] text-sm font-medium hover:bg-[var(--color-accent)]/25 transition-colors"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "已复制" : "复制"}
            </button>
            <button
              type="button"
              onClick={() => { onReset(); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/5 text-[var(--color-foreground-muted)] text-sm hover:bg-black/10 transition-colors"
            >
              继续扫描
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
