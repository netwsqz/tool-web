"use client";

import type { EverythingFileResult } from "@/types";
import { getFileIcon } from "@/lib/file-icons";
import { FolderIcon } from "./FileIcon";

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

interface Props {
  file: EverythingFileResult;
  onClick: () => void;
}

export function FileRow({ file, onClick }: Props) {
  const downloadUrl = `/api/everything/download?filepath=${encodeURIComponent(file.fullPath)}`;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${
        file.isFolder
          ? "cursor-pointer hover:bg-[var(--color-bg-card)]"
          : "hover:bg-[var(--color-bg-card)]/50"
      }`}
      onClick={file.isFolder ? onClick : undefined}
      onDoubleClick={!file.isFolder ? onClick : undefined}
    >
      {/* Icon */}
      <span className="flex-shrink-0 w-7 flex items-center justify-center">
        {file.isFolder ? (
          <FolderIcon className="w-5 h-5 text-yellow-500" />
        ) : (
          <span className="text-lg leading-none">{getFileIcon(file.name)}</span>
        )}
      </span>

      {/* Name */}
      <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">
        {file.name}
      </span>

      {/* Size */}
      <span className="text-xs text-[var(--color-text-secondary)] w-20 text-right flex-shrink-0">
        {file.isFolder ? "-" : formatSize(file.size)}
      </span>

      {/* Date */}
      <span className="text-xs text-[var(--color-text-secondary)] w-36 text-right flex-shrink-0 hidden sm:block">
        {formatDate(file.dateModified)}
      </span>

      {/* Download button (files only) */}
      {!file.isFolder && (
        <a
          href={downloadUrl}
          download={file.name}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity
            text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
            px-2 py-1 flex-shrink-0"
          title="下载"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </a>
      )}
    </div>
  );
}
