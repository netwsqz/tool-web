"use client";

import type { EverythingSortField } from "@/types";

interface Props {
  sortField: EverythingSortField;
  ascending: boolean;
  totalResults: number;
  onSetSort: (field: EverythingSortField) => void;
  onToggleAscending: () => void;
}

const SORT_OPTIONS: { field: EverythingSortField; label: string }[] = [
  { field: "name", label: "名称" },
  { field: "size", label: "大小" },
  { field: "date_modified", label: "修改日期" },
];

export function ToolBar({ sortField, ascending, totalResults, onSetSort, onToggleAscending }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-secondary)]">排序:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.field}
            onClick={() => onSetSort(opt.field)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              sortField === opt.field
                ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={onToggleAscending}
          className="text-xs px-2 py-1 rounded-lg text-[var(--color-text-secondary)]
            hover:text-[var(--color-text-primary)] transition-colors"
          title={ascending ? "升序" : "降序"}
        >
          {ascending ? "↑ 升序" : "↓ 降序"}
        </button>
      </div>
      <span className="text-xs text-[var(--color-text-secondary)]">
        共 {totalResults.toLocaleString()} 项
      </span>
    </div>
  );
}
