"use client";

interface Props {
  fileName: string;
  fileSize: number;
  url: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function FileCard({ fileName, fileSize, url }: Props) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);

  return (
    <div className="glass rounded-xl p-3 min-w-[200px]">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="text-2xl shrink-0">
          {isImage ? "🖼️" : "📄"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {formatSize(fileSize)}
          </p>
        </div>
      </a>
    </div>
  );
}
