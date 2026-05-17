"use client";

import { useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";
import "highlight.js/styles/github-dark.css";

export function MarkdownPreview({
  content,
  isLoading,
}: {
  content: string;
  isLoading?: boolean;
}) {
  const html = useMemo(
    () => (content ? renderMarkdown(content) : ""),
    [content]
  );

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 bg-white/5 rounded animate-pulse"
              style={{ width: `${60 + i * 10}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          选择一篇笔记开始预览
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div
        className="markdown-preview max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
