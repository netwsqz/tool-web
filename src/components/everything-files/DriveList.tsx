"use client";

interface Props {
  drives: string[];
  loading: boolean;
  onBrowse: (path: string) => void;
}

export function DriveList({ drives, loading, onBrowse }: Props) {
  return (
    <div>
      <h3 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 px-1">磁盘</h3>
      {loading ? (
        <div className="px-1 text-xs text-[var(--color-text-secondary)]">检测中...</div>
      ) : (
        <div className="space-y-0.5">
          {drives.map((drive) => (
            <button
              key={drive}
              onClick={() => onBrowse(drive)}
              className="w-full text-left px-2 py-1.5 rounded-lg text-sm
                text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                hover:bg-[var(--color-bg-card)] transition-colors"
            >
              💾 {drive}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
