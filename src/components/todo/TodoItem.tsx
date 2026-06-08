"use client";

import { useRef } from "react";
import type { TodoItem as TodoItemType, TodoTag } from "@/types";

interface TodoItemProps {
  todo: TodoItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  tags: TodoTag[];
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  high: { label: "高", color: "var(--color-destructive)" },
  medium: { label: "中", color: "var(--color-warning)" },
  low: { label: "低", color: "var(--color-success)" },
};

export function TodoItem({ todo, onToggle, onDelete, tags }: TodoItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const resolvedTag = todo.tag ? tags.find((t) => t.id === todo.tag) : undefined;

  return (
    <div
      ref={itemRef}
      className={`group glass-low rounded-xl p-3 flex items-center gap-3 animate-fade-in transition-opacity duration-200 ${todo.completed ? "opacity-70" : ""}`}
    >
      <button
        onClick={() => onToggle(todo.id)}
        className={`border-2 rounded-full transition-all duration-200 flex-shrink-0 relative size-5 ${todo.completed ? "border-[var(--color-success)] bg-[var(--color-success)]" : "border-[var(--color-border)] bg-transparent"}`}
      >
        {todo.completed && (
          <svg viewBox="0 0 12 12" className="size-3 absolute inset-0.5 animate-scale-in text-white">
            <path d="M2 6L5 9L10 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-sm break-words transition-all duration-200 ${todo.completed ? "line-through text-[var(--color-foreground-subtle)]" : "text-[var(--color-foreground)]"}`}
      >
        {todo.text}
      </span>
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs flex-shrink-0 bg-[var(--color-surface-hover)]">
        <span className="size-1.5 rounded-full" style={{ background: PRIORITY_MAP[todo.priority]?.color }} />
        <span className="text-[var(--color-foreground-muted)]">{PRIORITY_MAP[todo.priority]?.label}</span>
      </span>
      {resolvedTag && (
        <span className="px-2 py-0.5 rounded-full text-xs flex-shrink-0" style={{ backgroundColor: `${resolvedTag.color}20`, color: resolvedTag.color }}>
          {resolvedTag.name}
        </span>
      )}
      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 size-7 rounded-lg flex items-center justify-center hover:bg-[color-mix(in_srgb,var(--color-destructive)_8%,transparent)] flex-shrink-0 text-[var(--color-foreground-muted)] transition-all duration-150"
        aria-label="删除" title="删除"
      >
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}