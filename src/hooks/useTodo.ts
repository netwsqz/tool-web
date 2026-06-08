"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TodoItem, TodoTag } from "@/types";

const STORAGE_KEY_TODOS = "toolbox:todos";
const STORAGE_KEY_TAGS = "toolbox:todo-tags";

const DEFAULT_TAG_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function loadTodos(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TODOS);
    return raw ? (JSON.parse(raw) as TodoItem[]) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: TodoItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
}

function loadTags(): TodoTag[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TAGS);
    return raw ? (JSON.parse(raw) as TodoTag[]) : [];
  } catch {
    return [];
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 for insecure contexts (HTTP non-localhost)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function saveTags(tags: TodoTag[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(tags));
}

export function useTodo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [tags, setTags] = useState<TodoTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    setTodos(loadTodos());
    setTags(loadTags());
    setLoading(false);
  }, []);

  const addTodo = useCallback(
    (text: string, priority: TodoItem["priority"], tagId?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const todo: TodoItem = {
        id: generateId(),
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
        priority,
        tag: tagId,
      };
      setTodos((prev) => {
        const next = [todo, ...prev];
        saveTodos(next);
        return next;
      });
    },
    [],
  );

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      );
      saveTodos(next);
      return next;
    });
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTodos(next);
      return next;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => {
      const next = prev.filter((t) => !t.completed);
      saveTodos(next);
      return next;
    });
  }, []);

  const addTag = useCallback((name: string, color?: string) => {
    setTags((prev) => {
      if (prev.length >= 5) return prev;
      const tag: TodoTag = {
        id: generateId(),
        name: name.trim(),
        color: color ?? DEFAULT_TAG_COLORS[prev.length % DEFAULT_TAG_COLORS.length],
      };
      const next = [...prev, tag];
      saveTags(next);
      return next;
    });
  }, []);

  const deleteTag = useCallback((id: string) => {
    setTags((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTags(next);
      return next;
    });
    setActiveTag((prev) => (prev === id ? null : prev));
  }, []);

  const filteredTodos = useMemo(
    () =>
      todos.filter((t) => {
        if (filter === "active" && t.completed) return false;
        if (filter === "completed" && !t.completed) return false;
        if (activeTag && t.tag !== activeTag) return false;
        return true;
      }),
    [todos, filter, activeTag],
  );

  const completedCount = useMemo(
    () => todos.filter((t) => t.completed).length,
    [todos],
  );

  return {
    todos,
    filteredTodos,
    tags,
    filter,
    activeTag,
    loading,
    completedCount,
    totalCount: todos.length,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    setFilter,
    setActiveTag,
    addTag,
    deleteTag,
  };
}
