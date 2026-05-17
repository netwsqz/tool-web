"use client";

import { useEffect, useRef, useState } from "react";
import type { ObsidianFile, ObsidianSearchResult } from "@/types";

export function SearchBar({
  value,
  onChange,
  results,
  onSelect,
  isSearching,
}: {
  value: string;
  onChange: (val: string) => void;
  results: ObsidianSearchResult[];
  onSelect: (file: ObsidianFile) => void;
  isSearching: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter" && focusIdx >= 0) {
      e.preventDefault();
      onSelect(results[focusIdx].file);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && value.trim().length > 0;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-secondary)]">
          🔍
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setFocusIdx(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索笔记…"
          className="w-full pl-9 pr-3 py-2 text-sm bg-white/5 rounded-xl
            text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]
            outline-none border border-white/5 focus:border-[var(--color-accent)]/40
            transition-colors"
        />
        {isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="w-3 h-3 block rounded-full border border-[var(--color-accent)] border-t-transparent animate-spin" />
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-64 overflow-y-auto
          glass rounded-xl border border-white/10 shadow-xl">
          {results.length === 0 && !isSearching ? (
            <p className="px-3 py-3 text-xs text-[var(--color-text-secondary)] text-center">
              未找到匹配内容
            </p>
          ) : (
            results.map((r, i) => (
              <button
                key={r.file.path}
                onClick={() => {
                  onSelect(r.file);
                  setOpen(false);
                }}
                onMouseEnter={() => setFocusIdx(i)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors
                  ${i === focusIdx ? "bg-white/10" : "hover:bg-white/5"}`}
              >
                <div className="text-[var(--color-text-primary)] truncate">
                  {r.file.title}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                  {r.matches[0] || ""}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
