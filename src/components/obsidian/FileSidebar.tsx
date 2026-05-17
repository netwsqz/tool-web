"use client";

import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { FileTree } from "./FileTree";
import type { ObsidianFile, ObsidianSearchResult } from "@/types";

export function FileSidebar({
  files,
  activePath,
  onSelect,
  onDelete,
  searchValue,
  onSearchChange,
  searchResults,
  onSearchSelect,
  isSearching,
  onNewFile,
}: {
  files: ObsidianFile[];
  activePath: string | null;
  onSelect: (path: string) => void;
  onDelete: (path: string) => void;
  searchValue: string;
  onSearchChange: (val: string) => void;
  searchResults: ObsidianSearchResult[];
  onSearchSelect: (file: ObsidianFile) => void;
  isSearching: boolean;
  onNewFile: (name: string) => void;
}) {
  const [showNewInput, setShowNewInput] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSubmit = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onNewFile(trimmed);
    setNewName("");
    setShowNewInput(false);
  };

  const handleCancel = () => {
    setNewName("");
    setShowNewInput(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-3">
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          results={searchResults}
          onSelect={onSearchSelect}
          isSearching={isSearching}
        />
      </div>

      <hr className="border-white/5 mx-3" />

      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <FileTree
          files={files}
          activePath={activePath}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </div>

      {/* New file */}
      <div className="p-3 border-t border-white/5">
        {showNewInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") handleCancel();
              }}
              placeholder="新笔记名"
              autoFocus
              className="flex-1 px-2.5 py-1.5 text-sm bg-white/5 rounded-xl
                text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]
                outline-none border border-white/5 focus:border-[var(--color-accent)]/40
                transition-colors"
            />
            <button
              onClick={handleCancel}
              className="px-2 py-1 text-xs text-[var(--color-text-secondary)]
                hover:text-[var(--color-text-primary)] transition-colors"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewInput(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm
              text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
              hover:bg-white/5 rounded-xl transition-all"
          >
            <span>+</span>
            <span>新建笔记</span>
          </button>
        )}
      </div>
    </div>
  );
}
