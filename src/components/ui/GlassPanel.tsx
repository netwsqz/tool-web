"use client";

type GlassPanelProps = {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
};

export function GlassPanel({
  children,
  className = "",
  animate,
}: GlassPanelProps) {
  return (
    <div
      className={`rounded-3xl p-6 ${animate ? "animate-scale-in" : ""} ${className}`}
      style={{
        background: "var(--color-surface)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        border: "1px solid var(--color-border)",
      }}
    >
      {children}
    </div>
  );
}