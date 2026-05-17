import {
  Upload,
  FolderOpen,
  Clapperboard,
  Download,
  Music,
  FileText,
  Palette,
  Monitor,
  Timer,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { tools } from "@/lib/tools";
import { ToolCard } from "@/components/ui/ToolCard";
import type { ToolConfig } from "@/types";

/* ─── Category config ─── */

type CategoryMeta = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const categoryMeta: Record<string, CategoryMeta> = {
  file: { label: "文件工具", icon: FolderOpen },
  media: { label: "媒体工具", icon: Clapperboard },
  creative: { label: "创意工具", icon: Palette },
  system: { label: "系统工具", icon: Monitor },
};

/* ─── Stats ─── */

function StatsBar() {
  const activeCount = tools.filter((t) => t.status === "active").length;
  const catCount = Object.keys(categoryMeta).length;

  return (
    <div className="flex items-center gap-6 text-sm text-[var(--color-foreground-muted)]">
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-[var(--color-accent)]" />
        {activeCount} 个工具
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-[var(--color-success)]" />
        {catCount} 个分类
      </span>
    </div>
  );
}

/* ─── Hero ─── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-deep)] border border-[var(--color-border)] p-6 md:p-12 mb-6 md:mb-10">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 size-64 bg-[var(--color-accent)]/8 rounded-full blur-[80px]" />
      <div className="absolute -bottom-20 -left-20 size-48 bg-[var(--color-accent)]/5 rounded-full blur-[60px]" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-xl bg-[var(--color-accent)]/15 flex items-center justify-center">
            <Sparkles className="size-5 text-[var(--color-accent)]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[var(--color-foreground)] to-[var(--color-accent)] bg-clip-text text-transparent">
              万能工具箱
            </span>
          </h1>
        </div>
        <p className="text-[var(--color-foreground-muted)] mb-4 max-w-lg">
          本地优先的个人工具箱 — 无需注册，无需联网，所有工具即开即用。
          持续扩展，完全掌控。
        </p>
        <StatsBar />
      </div>
    </section>
  );
}

/* ─── Featured tools ─── */

const featuredIds = new Set(["everything-files", "media", "obsidian"]);
const featured = tools.filter((t) => featuredIds.has(t.id) && t.status === "active");
const other = tools.filter((t) => !featuredIds.has(t.id));

/* ─── Category section ─── */

function CategorySection({
  category,
  tools,
}: {
  category: string;
  tools: ToolConfig[];
}) {
  const meta = categoryMeta[category];
  if (!tools.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        {meta?.icon && <meta.icon className="size-4 text-[var(--color-foreground-muted)]" />}
        <h2 className="text-sm font-semibold text-[var(--color-foreground-muted)]">
          {meta?.label ?? category}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}

/* ─── Page ─── */

export default function HomePage() {
  // Group non-featured tools by category
  const byCategory: Record<string, ToolConfig[]> = {};
  for (const tool of other) {
    if (tool.status !== "active") continue;
    (byCategory[tool.category] ??= []).push(tool);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 md:py-12">
      <HeroSection />

      {/* Featured tools — 2x1 row */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-[var(--color-accent)]" />
          <h2 className="text-sm font-semibold text-[var(--color-foreground-muted)]">
            精选工具
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Category sections */}
      {Object.entries(byCategory).map(([cat, catTools]) => (
        <CategorySection key={cat} category={cat} tools={catTools} />
      ))}

      {/* Coming soon */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-[var(--color-foreground-muted)] mb-4">
          即将推出
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools
            .filter((t) => t.status === "coming-soon")
            .map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] pt-6 mt-12">
        <p className="text-xs text-[var(--color-foreground-subtle)] text-center">
          万能工具箱 · 本地工具集 · 持续扩展
        </p>
      </footer>
    </div>
  );
}
