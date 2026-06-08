"use client";

import type { EverythingFileResult } from "@/types";
import { getFileIcon } from "@/lib/file-icons";
import { FolderIcon } from "./FileIcon";
import { FileImage, FileVideo, FileAudio, FileText, FileArchive, File } from "lucide-react";

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Map emoji from getFileIcon to Lucide icon component */
function getFileTypeIcon(name: string) {
  const emoji = getFileIcon(name);
  const className = "w-4 h-4";
  if (emoji === "\u{1F5BC}" || emoji === "\u{1F4F7}" || emoji === "\u{1F3DE}")
    return <FileImage className={className} aria-hidden="true" />;
  if (emoji === "\u{1F3AC}" || emoji === "\u{1F39E}")
    return <FileVideo className={className} aria-hidden="true" />;
  if (emoji === "\u{1F3B5}" || emoji === "\u{1F3B6}" || emoji === "\u{1F3A7}")
    return <FileAudio className={className} aria-hidden="true" />;
  if (emoji === "\u{1F4C4}" || emoji === "\u{1F4D7}" || emoji === "\u{1F4C3}")
    return <FileText className={className} aria-hidden="true" />;
  if (emoji === "\u{1F4E6}" || emoji === "\u{1F4E9}" || emoji === "\u{1F5C3}")
    return <FileArchive className={className} aria-hidden="true" />;
  return <File className={className} aria-hidden="true" />;
}

interface Props {
  file: EverythingFileResult;
  onClick: () => void;
  onPreview?: () => void;
}

export function FileRow({ file, onClick, onPreview }: Props) {
  const downloadUrl = `/api/everything/download?filepath=${encodeURIComponent(file.fullPath)}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group
        cursor-pointer hover:bg-[var(--color-surface-hover)]
      `}
      role="button"
      tabIndex={0}
      aria-label={file.isFolder ? `打开文件夹 ${file.name}` : `打开文件 ${file.name}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {/* Icon */}
      <span className="flex-shrink-0 w-7 flex items-center justify-center">
        {file.isFolder ? (
          <FolderIcon className="w-5 h-5 text-[var(--color-warning)]" />
        ) : (
          <span className="text-[var(--color-foreground-muted)]">{getFileTypeIcon(file.name)}</span>
        )}
      </span>

      {/* Name */}
      <span className="flex-1 text-sm text-[var(--color-foreground)] truncate">
        {file.name}
      </span>

      {/* Size */}
      <span className="text-xs text-[var(--color-foreground-muted)] w-20 text-right flex-shrink-0">
        {file.isFolder ? "-" : formatSize(file.size)}
      </span>

      {/* Date */}
      <span className="text-xs text-[var(--color-foreground-muted)] w-36 text-right flex-shrink-0 hidden sm:block">
        {formatDate(file.dateModified)}
      </span>

      {/* Actions — always visible at reduced opacity, full on hover */}
      {!file.isFolder && (
        <span
          className="opacity-40 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              aria-label={`预览 ${file.name}`}
              className="text-xs px-2 py-1 rounded-lg bg-[var(--color-surface-active)] hover:bg-[var(--color-surface-hover)] text-[var(--color-foreground)] transition-colors"
            >
              预览
            </button>
          )}
          <a
            href={downloadUrl}
            download={file.name}
            aria-label={`下载 ${file.name}`}
            className="text-xs px-2 py-1 rounded-lg bg-[var(--color-surface-active)] hover:bg-[var(--color-surface-hover)] text-[var(--color-foreground)] transition-colors"
            title={`下载 ${file.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            ⬇
          </a>
        </span>
      )}
    </div>
  );
}
