"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[40vh] p-8">
      <div className="glass rounded-2xl p-8 text-center max-w-md">
        <div
          className="size-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "color-mix(in srgb, var(--color-destructive) 10%, transparent)",
            color: "var(--color-destructive)",
          }}
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--color-foreground)" }}
        >
          加载失败
        </h3>
        <p
          className="text-xs mb-5"
          style={{ color: "var(--color-foreground-muted)" }}
        >
          {error.message || "页面加载时出现错误"}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{
            background: "var(--color-accent-grad)",
            transition: "opacity 0.2s ease",
          }}
        >
          重试
        </button>
      </div>
    </div>
  );
}
