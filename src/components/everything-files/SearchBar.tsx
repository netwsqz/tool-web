"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export function SearchBar({ value, onChange, loading }: Props) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索文件... 支持 Everything 语法 (ext: ｜ size: ｜ dm: )"
        aria-label="搜索文件"
        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)]
          rounded-2xl px-4 py-3 pl-10 text-sm text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-secondary)]
          focus:outline-none focus:border-[var(--color-accent)] transition-colors"
      />
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      {loading && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
