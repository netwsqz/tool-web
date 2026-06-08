"use client";

import Link from "next/link";
import { useObsidian } from "@/hooks/useObsidian";
import { ObsidianLayout } from "@/components/obsidian/ObsidianLayout";
import { FileSidebar } from "@/components/obsidian/FileSidebar";
import { MarkdownEditor } from "@/components/obsidian/MarkdownEditor";
import { MarkdownPreview } from "@/components/obsidian/MarkdownPreview";

export default function ObsidianPage() {
  const o = useObsidian();

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-black/5 flex-shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)]
            hover:text-[var(--color-text-primary)] transition-colors"
        >
          ← 返回首页
        </Link>
        <div className="flex items-center gap-3">
          {o.error && (
            <span className="text-xs text-[var(--color-destructive)] bg-[var(--color-destructive)]/10 px-2 py-1 rounded-lg">
              {o.error}
              <button
                onClick={() => o.setError(null)}
                className="ml-2 hover:text-[var(--color-destructive)]"
              >
                ×
              </button>
            </span>
          )}
          {o.isSaving && (
            <span className="text-xs text-[var(--color-text-secondary)] animate-pulse">
              保存中…
            </span>
          )}
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 min-h-0">
        <ObsidianLayout
          sidebarCollapsed={o.sidebarCollapsed}
          previewCollapsed={o.previewCollapsed}
          onToggleSidebar={() => o.setSidebarCollapsed(!o.sidebarCollapsed)}
          onTogglePreview={() => o.setPreviewCollapsed(!o.previewCollapsed)}
          sidebar={
            <FileSidebar
              files={o.files}
              activePath={o.activeFilePath}
              onSelect={o.setActiveFilePath}
              onDelete={o.deleteFile}
              searchValue={o.searchQuery}
              onSearchChange={o.setSearchQuery}
              searchResults={o.searchResults}
              onSearchSelect={(file) => o.setActiveFilePath(file.path)}
              isSearching={o.isSearching}
              onNewFile={o.createFile}
            />
          }
          editor={
            <MarkdownEditor
              value={o.content}
              onChange={o.setContent}
              isDirty={o.isDirty}
              onSave={o.saveFile}
            />
          }
          preview={
            <MarkdownPreview
              content={o.content}
              isLoading={o.isLoadingContent}
            />
          }
        />
      </div>
    </div>
  );
}
