"use client";

import { ListChecks } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { useTodo } from "@/hooks/useTodo";
import { TodoInput } from "@/components/todo/TodoInput";
import { TodoFilter } from "@/components/todo/TodoFilter";
import { TodoList } from "@/components/todo/TodoList";

export default function TodoPage() {
  const {
    todos,
    filteredTodos,
    tags,
    filter,
    activeTag,
    loading,
    completedCount,
    totalCount,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    setFilter,
    setActiveTag,
    addTag,
  } = useTodo();

  return (
    <ToolLayout
      title="待办清单"
      description="本地优先的待办事项管理 · 支持标签与优先级"
      icon={ListChecks}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <TodoInput onAdd={addTodo} tags={tags} onAddTag={addTag} />
        <TodoFilter
          filter={filter}
          setFilter={setFilter}
          tags={tags}
          activeTag={activeTag}
          setActiveTag={setActiveTag}
          completedCount={completedCount}
          totalCount={totalCount}
        />
        <TodoList
          todos={filteredTodos}
          filter={filter}
          loading={loading}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onClearCompleted={clearCompleted}
          tags={tags}
          completedCount={completedCount}
        />
      </div>
    </ToolLayout>
  );
}
