"use client";

export function ObsidianLayout({
  sidebar,
  editor,
  preview,
  sidebarCollapsed,
  previewCollapsed,
  onToggleSidebar,
  onTogglePreview,
}: {
  sidebar: React.ReactNode;
  editor: React.ReactNode;
  preview: React.ReactNode;
  sidebarCollapsed: boolean;
  previewCollapsed: boolean;
  onToggleSidebar: () => void;
  onTogglePreview: () => void;
}) {
  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div
        className="flex-shrink-0 border-r border-[var(--color-border)] overflow-hidden transition-all duration-200"
        style={{ width: sidebarCollapsed ? 0 : 280 }}
      >
        <div className="w-[280px] h-full">{sidebar}</div>
      </div>

      {/* Sidebar toggle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
        className="flex-shrink-0 w-5 flex items-center justify-center
          text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]
          hover:bg-[var(--color-surface-active)] transition-colors text-xs"
      >
        {sidebarCollapsed ? "▶" : "◀"}
      </button>

      {/* Editor */}
      <div className="flex-1 min-w-0 border-r border-[var(--color-border)]">
        {editor}
      </div>

      {/* Preview toggle */}
      <button
        type="button"
        onClick={onTogglePreview}
        aria-label={previewCollapsed ? "展开预览" : "收起预览"}
        className="flex-shrink-0 w-5 flex items-center justify-center
          text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]
          hover:bg-[var(--color-surface-active)] transition-colors text-xs"
      >
        {previewCollapsed ? "◀" : "▶"}
      </button>

      {/* Preview */}
      <div
        className="flex-shrink-0 overflow-hidden transition-all duration-200 border-l border-[var(--color-border)]"
        style={{ width: previewCollapsed ? 0 : "50%" }}
      >
        <div className="w-full h-full">{preview}</div>
      </div>
    </div>
  );
}
