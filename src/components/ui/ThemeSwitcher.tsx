"use client";

import { useTheme } from "@/contexts/ThemeProvider";
import { THEMES, type ThemeId } from "@/lib/theme/themes";
import { Palette } from "lucide-react";

const THEME_NAMES: Record<ThemeId, string> = {
  blue: "经典蓝",
  amber: "暖琥珀",
  emerald: "翡翠绿",
  rose: "玫瑰红",
  custom: "自定义",
};

export function ThemeSwitcher() {
  const { themeId, customAccent, setTheme, setCustomAccent, resetAccent } = useTheme();
  const isCustom = themeId === "custom";
  const currentAccent = isCustom && customAccent ? customAccent : THEMES[themeId as Exclude<ThemeId, "custom">]?.accent ?? "#5e6ad2";

  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Palette className="size-3.5" style={{ color: "var(--color-foreground-muted)" }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-foreground-subtle)" }}>
          主题
        </span>
      </div>

      {/* Theme color dots */}
      <div className="flex gap-2 mb-3">
        {(Object.entries(THEMES) as [Exclude<ThemeId, "custom">, (typeof THEMES)[Exclude<ThemeId, "custom">]][]).map(([id, vars]) => {
          const isActive = themeId === id;
          return (
            <button
              key={id}
              onClick={() => setTheme(id)}
              title={THEME_NAMES[id]}
              aria-label={THEME_NAMES[id]}
              className="size-6 rounded-full transition-all duration-200"
              style={{
                background: vars.accent,
                boxShadow: isActive ? `0 0 0 2px ${vars.accent}, 0 0 0 3.5px rgba(255,255,255,0.15)` : "none",
                transform: isActive ? "scale(1.15)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            />
          );
        })}
      </div>

      {/* Custom color section */}
      <div className="flex items-center gap-2">
        <label className="relative cursor-pointer">
          <input
            type="color"
            value={currentAccent}
            onChange={(e) => setCustomAccent(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer size-0"
            aria-label="自定义强调色"
          />
          <div
            className="size-6 rounded-lg cursor-pointer transition-transform hover:scale-110"
            style={{
              background: currentAccent,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </label>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium" style={{ color: "var(--color-foreground-muted)" }}>
              {isCustom ? "自定义" : THEME_NAMES[themeId]}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--color-foreground-subtle)" }}>
              {currentAccent.toUpperCase()}
            </span>
          </div>
        </div>
        {isCustom && (
          <button
            onClick={resetAccent}
            className="text-[10px] px-1.5 py-0.5 rounded-md transition-colors"
            style={{
              color: "var(--color-foreground-subtle)",
              background: "rgba(255,255,255,0.05)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
            }}
          >
            重置
          </button>
        )}
      </div>
    </div>
  );
}
