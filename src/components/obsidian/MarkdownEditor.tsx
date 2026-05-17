"use client";

import { useCallback, useRef } from "react";

export function MarkdownEditor({
  value,
  onChange,
  isDirty,
  onSave,
}: {
  value: string;
  onChange: (val: string) => void;
  isDirty: boolean;
  onSave: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newVal = value.slice(0, start) + "  " + value.slice(end);
        onChange(newVal);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  return (
    <div className="relative h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <span className="text-xs text-[var(--color-text-secondary)]">
          Markdown
        </span>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              未保存
            </span>
          )}
          <button
            onClick={onSave}
            className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[var(--color-text-primary)] transition-colors"
          >
            Ctrl+S
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="在此输入 Markdown…"
        spellCheck={false}
        className="flex-1 w-full resize-none bg-transparent text-sm leading-relaxed
          text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]
          outline-none border-0 p-4 font-mono"
      />
    </div>
  );
}
