import Link from "next/link";
import {
  Upload,
  FolderOpen,
  Clapperboard,
  Download,
  Disc3,
  Music,
  Piano,
  FileText,
  Palette,
  Monitor,
  Timer,
  MessageCircle,
  ArrowLeftRight,
  Sparkles,
  ListChecks,
  QrCode,
  Swords,
} from "lucide-react";
import type { ToolConfig } from "@/types";
import { GlassPanel } from "./GlassPanel";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Upload,
  FolderOpen,
  Clapperboard,
  Download,
  Disc3,
  Music,
  Piano,
  FileText,
  Palette,
  Monitor,
  Timer,
  MessageCircle,
  ArrowLeftRight,
  Sparkles,
  ListChecks,
  QrCode,
  Swords,
};

export function ToolCard({ tool }: { tool: ToolConfig }) {
  const isActive = tool.status === "active";
  const Icon = tool.icon ? iconMap[tool.icon] : null;

  const card = (
    <GlassPanel
      className={`relative overflow-hidden transition-all duration-300 h-full
        ${isActive
          ? "group hover:scale-[1.02] hover:bg-white/8 hover:[animation:border-glow_2.5s_ease-in-out_infinite] cursor-pointer"
          : "opacity-40 cursor-default"
        }`}
    >
      {/* Hover glow */}
      {isActive && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute -top-12 -right-12 size-32 bg-[var(--color-accent)]/8 rounded-full blur-[40px]" />
          <div className="absolute -bottom-12 -left-12 size-24 bg-[var(--color-accent)]/5 rounded-full blur-[30px]" />
        </div>
      )}
      {/* Icon */}
      <div className="size-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-3
        group-hover:bg-[var(--color-accent)]/20 transition-colors duration-200">
        {Icon && <Icon className="size-5 text-[var(--color-accent)]" />}
      </div>

      <h3 className="text-base font-medium text-[var(--color-foreground)] mb-1">
        {tool.name}
      </h3>
      <p className="text-sm text-[var(--color-foreground-muted)] leading-relaxed">
        {tool.description}
      </p>

      <div className="mt-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full
            ${isActive
              ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
              : "bg-white/5 text-[var(--color-foreground-muted)]"
            }`}
        >
          {isActive ? "使用中" : "敬请期待"}
        </span>
      </div>
    </GlassPanel>
  );

  if (isActive && tool.path) {
    return <Link href={tool.path} prefetch={true}>{card}</Link>;
  }

  return card;
}
