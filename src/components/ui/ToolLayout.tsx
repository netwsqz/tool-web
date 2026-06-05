"use client";

import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

type ToolLayoutProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "full";
  /** Optional top-right action slot */
  actions?: React.ReactNode;
  noTransition?: boolean;
  padding?: string;
  hideBackLink?: boolean;
};

const widthMap: Record<string, string> = {
  sm: "max-w-lg",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
  "4xl": "max-w-7xl",
  "6xl": "max-w-[1400px]",
  full: "",
};

export function ToolLayout({
  title,
  description,
  icon: Icon,
  children,
  maxWidth = "lg",
  actions,
}: ToolLayoutProps) {
  const isFull = maxWidth === "full";

  return (
    <main className={`${widthMap[maxWidth] ?? widthMap.lg} py-8 ${
      isFull
        ? "pl-6 md:pl-8 pr-6 md:pr-8"
        : "mx-auto px-6"
    }`}>
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground-muted)]
          hover:text-[var(--color-foreground)] transition-colors mb-6 group"
      >
        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
        返回首页
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="size-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "var(--color-surface)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Icon className="size-4.5" style={{ color: "var(--color-accent)" }} />
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-foreground)]">
              {title}
            </h1>
            <p className="text-sm text-[var(--color-foreground-muted)]">
              {description}
            </p>
          </div>
        </div>
        {actions && (
          <div className="shrink-0">{actions}</div>
        )}
      </div>

      {/* Content */}
      {children}
    </main>
  );
}

/* --- Convenient state placeholders --- */

export function LoadingState({ text = "加载中..." }: { text?: string }) {
  return (
    <div
      className="rounded-2xl p-12 flex items-center justify-center"
      style={{
        background: "var(--color-surface)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="size-5 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
        <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>{text}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div
      className="rounded-2xl p-12 text-center"
      style={{
        background: "var(--color-surface)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        border: "1px solid var(--color-border)",
      }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--color-foreground-muted)" }}>{title}</p>
      {description && (
        <p className="text-xs" style={{ color: "var(--color-foreground-subtle)" }}>{description}</p>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "var(--color-surface)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        border: "1px solid rgba(239,68,68,0.15)",
      }}
    >
      <p className="text-sm" style={{ color: "var(--color-destructive)" }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: "rgba(239,68,68,0.15)",
            color: "var(--color-destructive)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)";
          }}
        >
          重试
        </button>
      )}
    </div>
  );
}
