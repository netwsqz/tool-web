"use client";

interface Props {
  totalResults: number;
  offset: number;
  count: number;
  elapsed: number;
  onPageChange: (offset: number) => void;
}

export function StatusBar({ totalResults, offset, count, elapsed, onPageChange }: Props) {
  const currentPage = Math.floor(offset / count) + 1;
  const totalPages = Math.max(1, Math.ceil(totalResults / count));

  return (
    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
      <span>
        共 {totalResults.toLocaleString()} 个结果 · 用时 {elapsed.toFixed(2)}s
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            disabled={offset === 0}
            onClick={() => onPageChange(0)}
            className="disabled:opacity-30 hover:text-[var(--color-accent)] transition-colors"
          >
            ««
          </button>
          <button
            disabled={offset === 0}
            onClick={() => onPageChange(Math.max(0, offset - count))}
            className="disabled:opacity-30 hover:text-[var(--color-accent)] transition-colors"
          >
            «
          </button>
          <span>
            第 {currentPage}/{totalPages} 页
          </span>
          <button
            disabled={offset + count >= totalResults}
            onClick={() => onPageChange(offset + count)}
            className="disabled:opacity-30 hover:text-[var(--color-accent)] transition-colors"
          >
            »
          </button>
          <button
            disabled={offset + count >= totalResults}
            onClick={() => onPageChange(Math.floor(totalResults / count) * count)}
            className="disabled:opacity-30 hover:text-[var(--color-accent)] transition-colors"
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
}
