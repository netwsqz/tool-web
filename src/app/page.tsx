"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { tools } from "@/lib/tools";
import ToolCard from "@/components/ui/ToolCard";
import { ToolLayout } from "@/components/ui/ToolLayout";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { iconMap, categoryMap, categoryLabels, type CategoryKey } from "@/components/ui/iconMap";

const categories = [
  {
    key: "file",
    title: "文件工具",
    tools: tools.filter(
      (t) =>
        t.category === "file" ||
        ["file-transfer", "everything-files"].includes(t.id)
    ),
  },
  {
    key: "media",
    title: "媒体工具",
    tools: tools.filter(
      (t) =>
        t.category === "media" ||
        ["bilibili-download", "media", "music-player"].includes(t.id)
    ),
  },
  {
    key: "creative",
    title: "创意工具",
    tools: tools.filter(
      (t) =>
        t.category === "creative" ||
        ["draw-guess", "piano", "metronome", "fruit-slice", "qr-code"].includes(t.id)
    ),
  },
  {
    key: "system",
    title: "系统工具",
    tools: tools.filter(
      (t) =>
        t.category === "system" ||
        ["system", "obsidian", "todo", "group-chat", "p2p-transfer"].includes(t.id)
    ),
  },
];

function HomePageContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  const search = searchParams.get("q")?.toLowerCase();

  const filteredTools = search
    ? tools.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
      )
    : filter
      ? tools.filter((t) => t.category === filter)
      : tools;

  const activeTools = tools.filter((t) => t.status === "active");
  const inactiveTools = tools.filter((t) => t.status !== "active");
  const HeroIcon = iconMap["toolbox"];

  return (
    <ToolLayout
      title=""
      description=""
      maxWidth="6xl"
      padding="p-0"
      hideBackLink
    >
      <div className="space-y-12">
        {/* ═══ Hero — Liquid Glass 面板 ═══ */}
        <div
          className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center animate-fade-in"
          style={{
            background: "var(--color-surface)",
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Decorative gradient blobs */}
          <div
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-20"
            style={{
              background: "var(--color-accent-grad)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full opacity-10"
            style={{
              background: "var(--color-accent-grad)",
              filter: "blur(60px)",
            }}
          />
          <div className="relative z-10">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
              style={{
                background: "var(--color-accent-grad)",
                boxShadow: "0 8px 24px var(--color-accent-glow)",
              }}
            >
              {HeroIcon ? <HeroIcon className="w-8 h-8 text-white" /> : null}
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold mb-3"
              style={{ color: "var(--color-foreground)" }}
            >
              万能工具箱
            </h1>
            <p
              className="text-base max-w-md mx-auto"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              本地优先的个人工具集合，轻量、快速、私密
            </p>
          </div>
        </div>

        {/* ═══ 搜索结果 ═══ */}
        {search && (
          <section className="animate-fade-in">
            <h2
              className="text-lg font-semibold mb-4 px-1"
              style={{ color: "var(--color-foreground)" }}
            >
              搜索结果 ({filteredTools.length})
            </h2>
            {filteredTools.length === 0 ? (
              <GlassPanel animate>
                <p style={{ color: "var(--color-foreground-muted)" }}>
                  没有找到匹配的工具
                </p>
              </GlassPanel>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map((tool) => (
                  <div key={tool.id} className="tool-card">
                    <ToolCard tool={tool} index={0} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ═══ 分类展示 ═══ */}
        {!search &&
          categories.map((cat, ci) => {
            const catTools = cat.tools.filter(
              (t) => t.status === "active" && activeTools.includes(t)
            );
            if (catTools.length === 0) return null;
            const CatIcon = categoryMap[cat.key as CategoryKey];
            return (
              <section
                key={cat.key}
                className="animate-fade-in"
                style={{ animationDelay: `${ci * 0.08}s` }}
              >
                <h2
                  className="flex items-center gap-2 text-lg font-semibold mb-4 px-1"
                  style={{ color: "var(--color-foreground)" }}
                >
                  {CatIcon && (
                    <CatIcon
                      className="w-5 h-5"
                      style={{ color: "var(--color-accent)" }}
                    />
                  )}
                  {cat.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catTools.map((tool) => (
                    <div key={tool.id} className="tool-card">
                      <ToolCard tool={tool} index={ci} />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

        {/* ═══ 开发中 ═══ */}
        {inactiveTools.length > 0 && !search && (
          <section className="animate-fade-in">
            <h2
              className="flex items-center gap-2 text-lg font-semibold mb-4 px-1"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              {(() => {
                const HammerIcon = iconMap["hammer"];
                return HammerIcon ? (
                  <HammerIcon
                    className="w-5 h-5"
                    style={{ color: "var(--color-foreground-subtle)" }}
                  />
                ) : null;
              })()}
              开发中
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveTools.map((tool) => (
                <div key={tool.id} className="tool-card">
                  <ToolCard tool={tool} index={0} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </ToolLayout>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HomePageContent />
    </Suspense>
  );
}
