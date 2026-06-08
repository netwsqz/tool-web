"use client";

import type { TodoItem as TodoItemType, TodoTag } from "@/types";
import { TodoItem } from "./TodoItem";

interface TodoListProps {
  todos: TodoItemType[];
  filter: "all" | "active" | "completed";
  loading: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClearCompleted: () => void;
  tags: TodoTag[];
  completedCount: number;
}

export function TodoList({ todos, filter, loading, onToggle, onDelete, onClearCompleted, tags, completedCount }: TodoListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-[var(--color-surface)]" />
        ))}
      </div>
    );
  }

  if (todos.length === 0) {
    const messages: Record<string, { title: string; desc: string }> = {
      all: { title: "暂无待办事项", desc: "添加一个新任务开始吧" },
      active: { title: "所有待办事项已完成", desc: "做得不错！" },
      completed: { title: "还没有已完成待办事项", desc: "完成一些任务后再来看看" },
    };
    const msg = messages[filter];
    return (
      <div className="glass rounded-2xl p-8 text-center animate-fade-in">
        <div className="size-12 rounded-xl flex items-center justify-center mx-auto mb-3 bg-[var(--color-accent-glow)]">
          <svg viewBox="0 0 24 24" className="size-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12l2 2 4-4M7.5 21h9a3 3 0 003-3V6a3 3 0 00-3-3h-9a3 3 0 00-3 3v12a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm font-medium mb-1 text-[var(--color-foreground)]">{msg.title}</p>
        <p className="text-xs text-[var(--color-foreground-muted)]">{msg.desc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} tags={tags} />
      ))}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-foreground-muted)]">
          {completedCount}/{todos.length + completedCount} 已完成
        </span>
        {completedCount > 0 && (
          <button onClick={onClearCompleted} className="text-xs text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] transition-colors duration-150">
            清空已完成
          </button>
        )}
      </div>
    </div>
  );
}