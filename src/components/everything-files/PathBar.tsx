"use client";

interface Props {
  currentPath: string | null;
  searchQuery: string;
  onNavigate: (path: string) => void;
}

export function PathBar({ currentPath, searchQuery, onNavigate }: Props) {
  if (searchQuery) {
    return (
      <div className="text-sm text-[var(--color-text-secondary)]">
        搜索: &quot;<span className="text-[var(--color-accent)]">{searchQuery}</span>&quot;
      </div>
    );
  }

  if (!currentPath) {
    return <div className="text-sm text-[var(--color-text-secondary)]">全部文件</div>;
  }

  const parts = currentPath.split("\\").filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [];
  let accumulated = "";
  for (let i = 0; i < parts.length; i++) {
    accumulated += (i === 0 ? "" : "\\") + parts[i];
    breadcrumbs.push({ label: parts[i], path: accumulated + (i === 0 ? "\\" : "") });
  }

  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap">
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && <span className="text-[var(--color-text-secondary)]">›</span>}
          <button
            onClick={() => onNavigate(crumb.path)}
            className={`hover:text-[var(--color-accent)] transition-colors ${
              i === breadcrumbs.length - 1
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            {crumb.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
