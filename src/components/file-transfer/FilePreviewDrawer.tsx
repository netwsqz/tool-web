"use client";

import { useEffect } from "react";
import { X, Download } from "lucide-react";
import { formatSize } from "@/lib/format";

type PreviewType = "image" | "audio" | "video" | "text";

function getPreviewType(filename: string): PreviewType {
  const ext = filename.toLowerCase().split(".").pop() || "";
  if (["jpg","jpeg","png","gif","svg","webp","ico","bmp"].includes(ext)) return "image";
  if (["mp3","wav","ogg","flac","aac","m4a"].includes(ext)) return "audio";
  if (["mp4","webm","avi","mov","mkv"].includes(ext)) return "video";
  return "text";
}

export function FilePreviewDrawer({ file, isOpen, onClose }: { file: { name: string; size: number; uploadedAt: string } | null; isOpen: boolean; onClose: () => void }) {
  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onClose]);
  if (!isOpen || !file) return null;
  const type = getPreviewType(file.name);
  const fileUrl = "/api/files/" + encodeURIComponent(file.name);

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0 0 0 / 0.35)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <a href={fileUrl} download className="size-9 rounded-xl glass flex items-center justify-center hover:opacity-80 transition-opacity" aria-label="下载">
          <Download className="size-[18px]" style={{ color: "var(--color-foreground)" }} />
        </a>
        <button onClick={onClose} className="size-9 rounded-xl glass flex items-center justify-center hover:opacity-80 transition-opacity" aria-label="关闭">
          <X className="size-[18px]" style={{ color: "var(--color-foreground)" }} />
        </button>
      </div>
      <div className="relative m-auto max-w-4xl max-h-[85vh] w-full glass rounded-3xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>{file.name}</p>
            <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>{formatSize(file.size)}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {type === "image" ? (
            <div className="flex items-center justify-center p-6 min-h-[200px]">
              <img src={fileUrl} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          ) : type === "video" ? (
            <div className="flex items-center justify-center p-6">
              <video src={fileUrl} controls className="max-w-full max-h-[70vh] rounded-xl" />
            </div>
          ) : type === "audio" ? (
            <div className="flex items-center justify-center p-10">
              <audio src={fileUrl} controls className="w-full" />
            </div>
          ) : (
            <div className="flex items-center justify-center p-10 text-center">
              <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>暂不支持预览此文件类型</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
