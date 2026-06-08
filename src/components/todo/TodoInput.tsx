"use client";

import { useState } from "react";
import type { TodoItem, TodoTag } from "@/types";

interface TodoInputProps {
  onAdd: (text: string, priority: TodoItem["priority"], tagId?: string) => void;
  tags: TodoTag[];
  onAddTag: (name: string, color: string) => void;
}

const PRIORITIES: { key: TodoItem["priority"]; label: string; color: string }[] = [
  { key: "high", label: "高", color: "var(--color-destructive)" },
  { key: "medium", label: "中", color: "var(--color-warning)" },
  { key: "low", label: "低", color: "var(--color-success)" },
];

const TAG_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

export function TodoInput({ onAdd, tags, onAddTag }: TodoInputProps) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<TodoItem["priority"]>("medium");
  const [selectedTag, setSelectedTag] = useState<string | undefined>();
  const [showTagForm, setShowTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, priority, selectedTag);
    setText("");
    setPriority("medium");
    setSelectedTag(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    onAddTag(name, TAG_COLORS[tags.length % TAG_COLORS.length]);
    setNewTagName("");
    setShowTagForm(false);
  };

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {/* Text input + submit */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="添加新的待办事项…"
          aria-label="新的待办事项"
          className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5
            text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)]
            outline-none focus:border-[var(--color-accent)] transition-colors duration-200"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium
            hover:bg-[var(--color-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-150 active:scale-[0.97]"
        >
          添加
        </button>
      </div>

      {/* Controls row: priority + tag */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Priority */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--color-foreground-muted)]">优先级</span>
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              onClick={() => setPriority(p.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all duration-150
                ${priority === p.key
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                  : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]"
                }`}
            >
              <span className="size-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label}
            </button>
          ))}
        </div>

        {/* Tag selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[var(--color-foreground-muted)]">标签</span>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(selectedTag === tag.id ? undefined : tag.id)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-all duration-150
                ${selectedTag === tag.id
                  ? "ring-1 ring-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "hover:bg-[var(--color-surface-hover)]"
                }`}
            >
              <span className="size-1.5 rounded-full inline-block mr-1" style={{ backgroundColor: tag.color }} />
              {tag.name}
            </button>
          ))}
          {tags.length < 5 && !showTagForm && (
            <button
              onClick={() => setShowTagForm(true)}
              className="size-6 rounded-lg bg-[var(--color-surface-hover)] text-[var(--color-foreground-muted)]
                hover:text-[var(--color-foreground)] flex items-center justify-center text-sm transition-colors"
              title="添加标签"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Add tag form */}
      {showTagForm && (
        <div className="flex items-center gap-2 animate-fade-in">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTag();
              if (e.key === "Escape") setShowTagForm(false);
            }}
            placeholder="输入标签名称…"
            aria-label="标签名称"
            autoFocus
            className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5
              text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-subtle)]
              outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <button
            onClick={handleAddTag}
            disabled={!newTagName.trim()}
            className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)] text-white text-xs font-medium
              hover:bg-[var(--color-accent-hover)] disabled:opacity-40 transition-all"
          >
            确认
          </button>
          <button
            onClick={() => { setShowTagForm(false); setNewTagName(""); }}
            className="px-3 py-1.5 rounded-lg text-xs text-[var(--color-foreground-muted)]
              hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)] transition-all"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}
