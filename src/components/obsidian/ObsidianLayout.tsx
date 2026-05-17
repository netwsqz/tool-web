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
        className="flex-shrink-0 border-r border-white/5 overflow-hidden transition-all duration-200"
        style={{ width: sidebarCollapsed ? 0 : 280 }}
      >
        <div className="w-[280px] h-full">{sidebar}</div>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="flex-shrink-0 w-5 flex items-center justify-center
          text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
          hover:bg-white/5 transition-colors text-xs"
      >
        {sidebarCollapsed ? "▶" : "◀"}
      </button>

      {/* Editor */}
      <div className="flex-1 min-w-0 border-r border-white/5">
        {editor}
      </div>

      {/* Preview toggle */}
      <button
        onClick={onTogglePreview}
        className="flex-shrink-0 w-5 flex items-center justify-center
          text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
          hover:bg-white/5 transition-colors text-xs"
      >
        {previewCollapsed ? "◀" : "▶"}
      </button>

      {/* Preview */}
      <div
        className="flex-shrink-0 overflow-hidden transition-all duration-200"
        style={{ width: previewCollapsed ? 0 : "50%" }}
      >
        <div className="w-full h-full">{preview}</div>
      </div>
    </div>
  );
}
