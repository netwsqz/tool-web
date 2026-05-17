"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Upload,
  FolderOpen,
  Clapperboard,
  Download,
  Piano,
  FileText,
  Palette,
  Monitor,
  Timer,
  MessageCircle,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { tools } from "@/lib/tools";
import type { ToolConfig } from "@/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Upload,
  FolderOpen,
  Clapperboard,
  Download,
  Piano,
  FileText,
  Palette,
  Monitor,
  Timer,
  MessageCircle,
  Sparkles,
};

const categoryLabels: Record<string, string> = {
  file: "文件工具",
  media: "媒体工具",
  creative: "创意工具",
  system: "系统工具",
};

function ToolNavItem({ tool, active }: { tool: ToolConfig; active: boolean }) {
  const Icon = tool.icon ? iconMap[tool.icon] : null;

  if (tool.status === "coming-soon") {
    return (
      <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-foreground-muted)] cursor-not-allowed group">
        <span className="size-4 shrink-0 opacity-40">
          {Icon && <Icon className="size-4" />}
        </span>
        <span className="opacity-40">{tool.name}</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--color-foreground-subtle)]">
          即将
        </span>
      </span>
    );
  }

  return (
    <Link
      href={tool.path}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
        ${active
          ? "bg-[var(--color-accent)]/12 text-[var(--color-accent)] font-medium"
          : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-white/5"
        }`}
    >
      <span className="size-4 shrink-0">
        {Icon && <Icon className="size-4" />}
      </span>
      <span>{tool.name}</span>
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeToolId = useMemo(() => {
    // extract tool id from pathname: /tools/<id>
    const parts = pathname.split("/");
    if (parts[1] === "tools" && parts[2]) return parts[2];
    return null;
  }, [pathname]);

  const grouped = useMemo(() => {
    const map: Record<string, ToolConfig[]> = {};
    for (const t of tools) {
      (map[t.category] ??= []).push(t);
    }
    return map;
  }, []);

  return (
    <nav className="flex flex-col h-full" aria-label="工具导航">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]">
        <div className="size-8 rounded-lg bg-[var(--color-accent)]/15 flex items-center justify-center">
          <Sparkles className="size-4 text-[var(--color-accent)]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[var(--color-foreground)] leading-tight">
            万能工具箱
          </h1>
          <p className="text-[11px] text-[var(--color-foreground-muted)]">
            本地工具集
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {Object.entries(grouped).map(([cat, catTools]) => (
          <div key={cat}>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-foreground-subtle)] px-3 mb-2">
              {categoryLabels[cat] ?? cat}
            </h2>
            <div className="space-y-0.5">
              {catTools.map((tool) => (
                <ToolNavItem
                  key={tool.id}
                  tool={tool}
                  active={tool.id === activeToolId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}

export function SidebarToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed top-3 left-3 z-50 size-9 flex items-center justify-center rounded-lg glass-low hover:bg-[var(--color-surface-hover)] transition-colors duration-200 lg:hidden"
      aria-label={open ? "关闭导航" : "打开导航"}
    >
      {open ? <X className="size-4" /> : <Menu className="size-4" />}
    </button>
  );
}
