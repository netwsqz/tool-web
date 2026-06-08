"use client";

import type { TodoTag } from "@/types";

interface TodoFilterProps {
  filter: "all" | "active" | "completed";
  setFilter: (f: "all" | "active" | "completed") => void;
  tags: TodoTag[];
  activeTag: string | null;
  setActiveTag: (tagId: string | null) => void;
  completedCount: number;
  totalCount: number;
}

const FILTERS: { key: "all" | "active" | "completed"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "active", label: "未完成" },
  { key: "completed", label: "已完成" },
];

export function TodoFilter({
  filter,
  setFilter,
  tags,
  activeTag,
  setActiveTag,
  completedCount,
  totalCount,
}: TodoFilterProps) {
  return (
    <div className="glass rounded-xl p-2 space-y-2">
      {/* Main filter row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`px-3 py-1.5 rounded-full text-sm transition-all duration-150
                ${filter === f.key
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--color-foreground-muted)]">
          {completedCount}/{totalCount} 已完成
        </span>
      </div>

      {/* Tag filter chips */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2 py-0.5 rounded-full text-xs transition-all duration-150
              ${!activeTag
                ? "bg-[var(--color-surface-hover)] text-[var(--color-foreground)]"
                : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
              }`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all duration-150
                ${activeTag === tag.id
                  ? "ring-1 bg-opacity-20 text-[var(--color-foreground)]"
                  : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]"
                }`}
              style={{
                backgroundColor: activeTag === tag.id ? `${tag.color}20` : undefined,
                borderColor: activeTag === tag.id ? tag.color : undefined,
                borderWidth: activeTag === tag.id ? "1px" : undefined,
              }}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
