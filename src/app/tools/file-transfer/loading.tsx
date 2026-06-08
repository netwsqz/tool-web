"use client";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] p-8">
      <div className="flex flex-col items-center gap-4">
        <div className="size-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
          加载中…
        </p>
      </div>
    </div>
  );
}
