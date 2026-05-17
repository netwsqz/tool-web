"use client";

import { useState } from "react";
import { FolderOpen, PanelLeftClose, PanelLeft } from "lucide-react";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { useEverything } from "@/hooks/useEverything";
import { SearchBar } from "@/components/everything-files/SearchBar";
import { Sidebar } from "@/components/everything-files/Sidebar";
import { PathBar } from "@/components/everything-files/PathBar";
import { ToolBar } from "@/components/everything-files/ToolBar";
import { FileList } from "@/components/everything-files/FileList";
import { StatusBar } from "@/components/everything-files/StatusBar";

export default function EverythingFilesPage() {
  const {
    results,
    totalResults,
    currentPath,
    searchQuery,
    loading,
    error,
    elapsed,
    sortField,
    ascending,
    offset,
    count,
    drives,
    drivesLoading,
    favorites,
    search,
    browse,
    setSort,
    toggleAscending,
    setPage,
    addFavorite,
    removeFavorite,
    refresh,
  } = useEverything();

  const [showSidebar, setShowSidebar] = useState(false);

  const handleBrowse = (folderPath: string) => {
    setShowSidebar(false);
    browse(folderPath);
  };

  return (
    <ToolLayout
      title="文件管理"
      description="Everything 引擎 · 本地文件搜索与浏览"
      icon={FolderOpen}
      maxWidth="full"
    >
      {/* Search */}
      <div className="mb-4">
        <SearchBar value={searchQuery} onChange={search} loading={loading} />
      </div>

      {/* Main content */}
      <div className="flex gap-6 h-[65vh] relative">
        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-40 h-full w-56 shrink-0 space-y-6 overflow-y-auto
            bg-[var(--color-bg-elevated)] border-r border-[var(--color-border)] lg:bg-transparent lg:border-none
            transition-transform duration-300 ease-[var(--easing-smooth)]
            ${showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <Sidebar
            drives={drives}
            drivesLoading={drivesLoading}
            favorites={favorites}
            currentPath={currentPath}
            onBrowse={handleBrowse}
            onAddFavorite={addFavorite}
            onRemoveFavorite={removeFavorite}
          />
        </aside>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-shrink-0 space-y-2 mb-2">
            <div className="flex items-center gap-2">
              {currentPath && (
                <button
                  onClick={() => {
                    const parts = currentPath.split("\\").filter(Boolean);
                    if (parts.length <= 1) return;
                    parts.pop();
                    const upPath = parts.join("\\") + (parts.length === 1 ? "\\" : "");
                    browse(upPath);
                  }}
                  className="text-xs px-2 py-1 rounded-lg text-[var(--color-foreground-muted)]
                    hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)]
                    transition-colors"
                >
                  ↑ 上级目录
                </button>
              )}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden text-xs px-2 py-1 rounded-lg text-[var(--color-foreground-muted)]
                  hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)]
                  transition-colors flex items-center gap-1"
              >
                {showSidebar ? <PanelLeftClose className="size-3.5" /> : <PanelLeft className="size-3.5" />}
                {showSidebar ? "关闭" : "浏览"}
              </button>
              <PathBar
                currentPath={currentPath}
                searchQuery={searchQuery}
                onNavigate={handleBrowse}
              />
            </div>
            <ToolBar
              sortField={sortField}
              ascending={ascending}
              totalResults={totalResults}
              onSetSort={setSort}
              onToggleAscending={toggleAscending}
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 glass rounded-2xl p-3">
            <FileList
              results={results}
              loading={loading}
              error={error}
              onOpenFolder={handleBrowse}
              onRefresh={refresh}
            />
          </div>

          <div className="flex-shrink-0 mt-2">
            <StatusBar
              totalResults={totalResults}
              offset={offset}
              count={count}
              elapsed={elapsed}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
