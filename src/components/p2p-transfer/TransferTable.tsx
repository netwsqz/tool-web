"use client";

import { X } from "lucide-react";
import type { P2PTransferItem } from "@/types/p2p";
import { formatSize } from "@/lib/format";

interface Props {
  transfers: P2PTransferItem[];
  onCancel: (id: string) => void;
  onClearCompleted: () => void;
}

export function TransferTable({ transfers, onCancel, onClearCompleted }: Props) {
  const hasAny = transfers.length > 0;

  if (!hasAny) return null;

  return (
    <div className="glass rounded-3xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[var(--color-foreground)]">
          传输列表
        </h3>
        <button
          type="button"
          onClick={onClearCompleted}
          className="text-xs text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors"
        >
          清除已完成
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {transfers.map((t) => (
          <TransferRow key={t.id} item={t} onCancel={onCancel} />
        ))}
      </div>
    </div>
  );
}

function TransferRow({ item, onCancel }: { item: P2PTransferItem; onCancel: (id: string) => void }) {
  const isActive = item.status === "transferring" || item.status === "pending";
  const isFailed = item.status === "failed";
  const isDone = item.status === "completed";

  const barColor =
    item.status === "completed"
      ? "bg-green-500"
      : item.status === "failed" || item.status === "cancelled"
        ? "bg-[var(--color-destructive)]"
        : "bg-[var(--color-accent)]";

  const statusText =
    item.status === "pending"
      ? "等待中"
      : item.status === "transferring"
        ? "传输中"
        : item.status === "completed"
          ? "已完成"
          : item.status === "failed"
            ? "失败"
            : "已取消";

  const statusColor =
    item.status === "completed"
      ? "text-green-400"
      : item.status === "failed" || item.status === "cancelled"
        ? "text-[var(--color-destructive)]"
        : "text-[var(--color-foreground-muted)]";

  return (
    <div className="rounded-2xl bg-black/5 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-black/10 shrink-0 font-medium">
            {item.direction === "send" ? "↑" : "↓"}
          </span>
          <span className="text-sm truncate">{item.fileName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs ${statusColor}`}>{statusText}</span>
          {isActive && (
            <button
              type="button"
              onClick={() => onCancel(item.id)}
              className="text-[var(--color-foreground-muted)] hover:text-[var(--color-destructive)] transition-colors"
              aria-label="取消传输"
            >
              <X className="size-3.5" />
            </button>
          )}
          {isFailed && item.error && (
            <span className="text-xs text-[var(--color-destructive)]" title={item.error}>
              {item.error}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${item.progress}%` }}
          />
        </div>
        <span className="text-xs text-[var(--color-foreground-muted)] tabular-nums shrink-0 w-10 text-right">
          {item.progress}%
        </span>
      </div>

      {(item.status === "transferring" || item.status === "pending") && (
        <div className="flex items-center gap-3 text-xs text-[var(--color-foreground-muted)]">
          <span>{formatSize(item.fileSize)}</span>
          {item.speed > 0 && <span>{formatSize(item.speed)}/s</span>}
          {item.eta > 0 && (
            <span>
              剩余 {item.eta > 60 ? `${Math.ceil(item.eta / 60)} 分钟` : `${Math.ceil(item.eta)} 秒`}
            </span>
          )}
        </div>
      )}

      {isDone && (
        <div className="text-xs text-[var(--color-foreground-muted)]">
          {formatSize(item.fileSize)}
        </div>
      )}
    </div>
  );
}
