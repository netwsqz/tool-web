"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { tools } from "@/lib/tools";
import type { ToolConfig } from "@/types";
import { iconMap, categoryLabels } from "@/components/ui/iconMap";
import { ThemeSwitcher } from "./ThemeSwitcher";

function ToolNavItem({ tool, active, onClose }: { tool: ToolConfig; active: boolean; onClose: () => void }) {
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
      onClick={onClose}
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

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
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
    <nav
      ref={navRef}
      className={`flex flex-col ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-300 ease-[var(--easing-smooth)]`}
      style={{
        position: "fixed",
        top: "12px",
        left: "12px",
        bottom: "12px",
       width: "220px",
        background: "var(--color-bg-elevated)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid var(--color-border)",
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px var(--color-border) inset",
        zIndex: 50,
      }}
      aria-label="工具导航"
    >
      {/* Accent top highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "20%",
          right: "20%",
          height: "1px",
          background: "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
          opacity: 0.4,
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]">
        <div className="size-8 rounded-lg bg-[var(--color-accent)]/15 flex items-center justify-center">
          <Sparkles className="size-4 text-[var(--color-accent)]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] leading-tight">
            万能工具箱
          </h2>
          <p className="text-[11px] text-[var(--color-foreground-muted)]">
            本地工具集
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6 sidebar-scrollbar"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.15) transparent",
        }}
      >
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
                  onClose={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Theme Switcher at bottom */}
      <div className="shrink-0 px-3 pb-4 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <ThemeSwitcher />
      </div>
    </nav>
  );
}
