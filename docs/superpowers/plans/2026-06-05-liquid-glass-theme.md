# Liquid Glass 全站毛玻璃主题系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全站 UI 毛玻璃透明化 + 4 套主题切换系统 + 自定义强调色

**Architecture:** ThemeProvider 通过 CSS 变量批量切换主题，4 组预设变量定义在 themes.ts，localStorage 持久化。所有现有组件通过 `var(--color-*)` 自动响应。

**Tech Stack:** Next.js 15 (Client Components), TypeScript, Tailwind CSS v4, React Context

---

## 文件结构

```
src/
├── lib/theme/
│   ├── themes.ts              ← NEW: 4 组主题 CSS 变量定义
│   └── storage.ts             ← NEW: localStorage 读写
├── contexts/
│   └── ThemeProvider.tsx      ← NEW: 主题上下文
├── components/ui/
│   ├── ThemeSwitcher.tsx      ← NEW: 色球选择器 + color input
│   ├── Sidebar.tsx            ← MODIFY: 玻璃背景 + 底部 ThemeSwitcher
│   ├── ToolCard.tsx           ← MODIFY: 增强毛玻璃
│   ├── ToolLayout.tsx         ← MODIFY: 增强毛玻璃状态
│   ├── GlassPanel.tsx         ← MODIFY: 使用增强玻璃
│   └── AppShell.tsx           ← MODIFY: 鼠标追踪环境光
├── app/
│   ├── layout.tsx             ← MODIFY: 包裹 ThemeProvider
│   └── page.tsx               ← MODIFY: 增强首页玻璃效果
└── globals.css                ← MODIFY: 玻璃变量 + 噪点 + 环境辉光
```

---

### Task 1: 主题数据层 — themes.ts + storage.ts

**Files:**
- Create: `src/lib/theme/themes.ts`
- Create: `src/lib/theme/storage.ts`

- [ ] **Step 1: Create themes.ts**

```typescript
// src/lib/theme/themes.ts

export type ThemeId = "blue" | "amber" | "emerald" | "rose" | "custom";

export interface ThemeVars {
  accent: string;
  accentHover: string;
  accentGlow: string;
  accentGrad: string;
}

export const THEMES: Record<Exclude<ThemeId, "custom">, ThemeVars> = {
  blue: {
    accent: "#5e6ad2",
    accentHover: "#7c86e0",
    accentGlow: "rgba(94,106,210,0.18)",
    accentGrad: "linear-gradient(135deg, #5e6ad2, #8b5cf6)",
  },
  amber: {
    accent: "#d4a04a",
    accentHover: "#e8b86a",
    accentGlow: "rgba(212,160,74,0.18)",
    accentGrad: "linear-gradient(135deg, #d4a04a, #cd7f32)",
  },
  emerald: {
    accent: "#34d399",
    accentHover: "#6ee7b7",
    accentGlow: "rgba(52,211,153,0.18)",
    accentGrad: "linear-gradient(135deg, #34d399, #0891b2)",
  },
  rose: {
    accent: "#f43f5e",
    accentHover: "#fb7185",
    accentGlow: "rgba(244,63,94,0.18)",
    accentGrad: "linear-gradient(135deg, #f43f5e, #e11d48)",
  },
};

export function applyThemeVars(vars: ThemeVars) {
  const root = document.documentElement;
  root.style.setProperty("--color-accent", vars.accent);
  root.style.setProperty("--color-accent-hover", vars.accentHover);
  root.style.setProperty("--color-accent-glow", vars.accentGlow);
  root.style.setProperty("--color-accent-grad", vars.accentGrad);
}

export function deriveGlowFromAccent(hex: string): string {
  // Convert hex to rgba with 0.18 alpha for glow
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.18)`;
}

export function lightenHex(hex: string, amount = 30): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function buildAccentGrad(hex: string): string {
  const lightened = lightenHex(hex, 40);
  return `linear-gradient(135deg, ${hex}, ${lightened})`;
}
```

- [ ] **Step 2: Create storage.ts**

```typescript
// src/lib/theme/storage.ts
import type { ThemeId } from "./themes";

const PREF_KEY = "theme-pref";
const ACCENT_KEY = "theme-accent";

export function loadThemePref(): ThemeId {
  if (typeof window === "undefined") return "blue";
  return (localStorage.getItem(PREF_KEY) as ThemeId) || "blue";
}

export function saveThemePref(id: ThemeId) {
  localStorage.setItem(PREF_KEY, id);
}

export function loadCustomAccent(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCENT_KEY);
}

export function saveCustomAccent(hex: string) {
  localStorage.setItem(ACCENT_KEY, hex);
}
```

---

### Task 2: ThemeProvider Context

**Files:**
- Create: `src/contexts/ThemeProvider.tsx`

- [ ] **Step 1: Create ThemeProvider.tsx**

```typescript
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { THEMES, applyThemeVars, deriveGlowFromAccent, buildAccentGrad, type ThemeId, type ThemeVars } from "@/lib/theme/themes";
import { loadThemePref, saveThemePref, loadCustomAccent, saveCustomAccent } from "@/lib/theme/storage";

type ThemeContextValue = {
  themeId: ThemeId;
  customAccent: string | null;
  setTheme: (id: ThemeId) => void;
  setCustomAccent: (hex: string) => void;
  resetAccent: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("blue");
  const [customAccent, setCustomAccentState] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedTheme = loadThemePref();
    const savedAccent = loadCustomAccent();
    setThemeId(savedTheme);
    setCustomAccentState(savedAccent);
    setMounted(true);
  }, []);

  // Apply CSS variables whenever theme or custom accent changes
  const apply = useCallback((id: ThemeId, accent: string | null) => {
    let vars: ThemeVars;
    if (id === "custom" && accent) {
      vars = {
        accent,
        accentHover: accent, // will override below
        accentGlow: deriveGlowFromAccent(accent),
        accentGrad: buildAccentGrad(accent),
      };
    } else {
      vars = { ...THEMES[id as Exclude<ThemeId, "custom">] };
    }
    applyThemeVars(vars);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    apply(themeId, customAccent);
  }, [themeId, customAccent, mounted, apply]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    saveThemePref(id);
    if (id !== "custom") {
      setCustomAccentState(null);
    }
  }, []);

  const setCustomAccent = useCallback((hex: string) => {
    setThemeId("custom");
    setCustomAccentState(hex);
    saveCustomAccent(hex);
    saveThemePref("custom");
  }, []);

  const resetAccent = useCallback(() => {
    setThemeId("blue");
    setCustomAccentState(null);
    saveThemePref("blue");
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, customAccent, setTheme, setCustomAccent, resetAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

### Task 3: 集成 ThemeProvider 到 layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Wrap with ThemeProvider**

```tsx
import type { Metadata } from "next";
import { AppShell } from "@/components/ui/AppShell";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "万能工具箱",
  description: "本地工具集 · 持续扩展",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={"min-h-screen"}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

### Task 4: 更新 globals.css — 玻璃变量 + 噪点 + 环境辉光 + 过渡

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update glass surface opacity and add CSS transitions**

Change `--color-surface` opacity and add transition to `*`:

Find:
```
  --color-surface: rgb(255 255 255 / 0.05);
```

Replace with:
```
  --color-surface: rgb(255 255 255 / 0.035);
```

Add after the `@utility focus-ring` block:
```css
/* 主题切换过渡 */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
```

- [ ] **Step 2: Update body::before with theme-aware accent glows**

Replace the entire `body::before` block:

```css
/* Ambient accent glow — shifts with theme */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 20% 10%, var(--color-accent-glow), transparent 60%),
    radial-gradient(ellipse 50% 50% at 80% 80%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 50%),
    radial-gradient(ellipse 40% 40% at 20% 80%, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step 3: Add CSS noise texture body::after**

```css
/* Noise grain texture for glass depth */
body::after {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  opacity: 0.025;
  pointer-events: none;
  z-index: 0;
}
```

---

### Task 5: 更新 AppShell — 鼠标追踪环境光

**Files:**
- Modify: `src/components/ui/AppShell.tsx`

- [ ] **Step 1: Enhance mouse tracking to shift ambient glow positions**

Replace the `animate` function to also move the body::before gradient hotspots:

Find the `animate()` function inside AppShell and update it:

```tsx
  function animate() {
    const cx = currentRef.current;
    const tx = targetRef.current;
    // Smooth follow
    cx.x += (tx.x - cx.x) * 0.05;
    cx.y += (tx.y - cx.y) * 0.05;

    if (typeof document !== "undefined") {
      document.body.style.setProperty("--ambient-x", `${cx.x * 100}%`);
      document.body.style.setProperty("--ambient-y", `${cx.y * 100}%`);

      // Shift the primary glow hotspot with cursor
      const baseX = 20 + (cx.x - 0.5) * 15;  // 12.5%–27.5%
      const baseY = 10 + (cx.y - 0.5) * 10;   // 5%–15%
      document.body.style.setProperty("--glow-x", `${baseX}%`);
      document.body.style.setProperty("--glow-y", `${baseY}%`);

      // Secondary glow moves opposite
      const secX = 80 - (cx.x - 0.5) * 10;
      const secY = 80 - (cx.y - 0.5) * 10;
      document.body.style.setProperty("--glow-sec-x", `${secX}%`);
      document.body.style.setProperty("--glow-sec-y", `${secY}%`);
    }

    // Continue if still moving
    if (Math.abs(tx.x - cx.x) > 0.001 || Math.abs(tx.y - cx.y) > 0.001) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      rafRef.current = 0;
    }
  }
```

- [ ] **Step 2: Set initial glow positions on mount**

Add a `useEffect` for initial glow positions:

```tsx
  // Set initial glow positions on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.setProperty("--glow-x", "20%");
      document.body.style.setProperty("--glow-y", "10%");
      document.body.style.setProperty("--glow-sec-x", "80%");
      document.body.style.setProperty("--glow-sec-y", "80%");
    }
  }, []);
```

Append after the `rafRef` ref declarations, before `handleMouseMove`.

- [ ] **Step 3: Update globals.css body::before to use the dynamic position variables**

Replace the body::before block again with position-aware gradients:

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at var(--glow-x, 20%) var(--glow-y, 10%), var(--color-accent-glow), transparent 60%),
    radial-gradient(ellipse 50% 50% at var(--glow-sec-x, 80%) var(--glow-sec-y, 80%), color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 50%),
    radial-gradient(ellipse 40% 40% at 20% 80%, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

---

### Task 6: 创建 ThemeSwitcher 组件

**Files:**
- Create: `src/components/ui/ThemeSwitcher.tsx`

- [ ] **Step 1: Create ThemeSwitcher.tsx**

```tsx
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
        {(Object.entries(THEMES) as [ThemeId, typeof THEMES.blue][]).map(([id]) => {
          const vars = THEMES[id];
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

      {/* Custom color input */}
      <div className="flex items-center gap-2">
        <label className="relative cursor-pointer">
          <input
            type="color"
            value={isCustom && customAccent ? customAccent : THEMES.blue.accent}
            onChange={(e) => setCustomAccent(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer size-0"
            aria-label="自定义强调色"
          />
          <div
            className="size-6 rounded-lg cursor-pointer transition-transform hover:scale-110"
            style={{
              background: isCustom && customAccent ? customAccent : THEMES.blue.accent,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
        </label>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium" style={{ color: "var(--color-foreground-muted)" }}>
              {isCustom ? "自定义" : themeId ? THEME_NAMES[themeId] : "蓝色"}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "var(--color-foreground-subtle)" }}>
              {isCustom && customAccent ? customAccent.toUpperCase() : THEMES[themeId as Exclude<ThemeId, "custom">]?.accent.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <input
              type="color"
              value={isCustom && customAccent ? customAccent : THEMES.blue.accent}
              onChange={(e) => setCustomAccent(e.target.value)}
              className="flex-1 h-1.5 rounded-full cursor-pointer border-none p-0"
              style={{
                background: `linear-gradient(90deg, ${isCustom && customAccent ? customAccent : THEMES.blue.accent}, ${isCustom && customAccent ? customAccent : THEMES.blue.accent})`,
                accentColor: isCustom && customAccent ? customAccent : THEMES.blue.accent,
                WebkitAppearance: "none",
                appearance: "none",
              }}
              aria-label="自定义颜色滑块"
            />
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
```

---

### Task 7: 更新 Sidebar — 毛玻璃背景 + ThemeSwitcher

**Files:**
- Modify: `src/components/ui/Sidebar.tsx`

- [ ] **Step 1: Convert Sidebar to floating glass panel**

Find `className="flex flex-col h-full"` inside the `<nav>` element. Replace the wrapping of the entire nav:

Inside the nav, add a glass style to the container. The key changes:
1. Wrap sidebar content in a glass-styled container
2. Add `ThemeSwitcher` at the bottom
3. Keep existing structure

Update the `<nav>` JSX:

```tsx
  return (
    <nav
      className="flex flex-col h-full"
      style={{
        background: "rgba(10,10,12,0.85)",
        backdropFilter: "blur(32px) saturate(150%)",
        WebkitBackdropFilter: "blur(32px) saturate(150%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
      aria-label="工具导航"
    >
      {/* Logo — same as before */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]">
        ...
      </div>

      {/* Navigation — same as before */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        ...
      </div>

      {/* Theme Switcher at bottom */}
      <div className="shrink-0 px-3 pb-4 pt-2 border-t border-[rgba(255,255,255,0.05)]">
        <ThemeSwitcher />
      </div>
    </nav>
  );
```

Add the import:
```tsx
import { ThemeSwitcher } from "./ThemeSwitcher";
```

Make sure to remove the existing `border-b` from the logo section (it's now handled by the glass panel) or keep it for visual separation.

---

### Task 8: 更新 ToolCard — 增强毛玻璃 + 辉光悬停

**Files:**
- Modify: `src/components/ui/ToolCard.tsx`

- [ ] **Step 1: Enhance glass styling on ToolCard**

The ToolCard already uses `glass-panel` class. Update it to use glass styling more explicitly with inline styles matching the new glass aesthetic. The key changes:

1. Replace the reliance on `glass-panel` CSS class with explicit glass styles
2. Add accent-colored hover glow
3. Add glass border

Update the `<div>` with `className="glass-panel..."`:

```tsx
      <div
        className={`rounded-3xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isActive
            ? "cursor-pointer motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-lg"
            : "opacity-40 cursor-default"
        }`}
        style={{
          background: "var(--color-surface)",
          backdropFilter: "blur(24px) saturate(150%)",
          WebkitBackdropFilter: "blur(24px) saturate(150%)",
          border: "1px solid var(--color-border)",
          position: "relative",
          overflow: "hidden",
          padding: "20px",
        }}
      >
```

And update the hover glow overlay's style to use the accent variable:

```tsx
        <div
          className="absolute inset-0 rounded-[1.75rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, var(--color-accent-glow), transparent 70%)",
          }}
        />
```

---

### Task 9: 更新 ToolLayout — 玻璃头部 + 状态组件

**Files:**
- Modify: `src/components/ui/ToolLayout.tsx`

- [ ] **Step 1: Enhance header and state components with glass**

Update the header section to add glass styling to the icon background:

Find the icon div:
```tsx
            <div className="size-9 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
```

No change needed — this already uses accent. But add a glass background:

```tsx
            <div
              className="size-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "var(--color-surface)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid var(--color-border)",
              }}
            >
```

Update `LoadingState` to use enhanced glass:
```tsx
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
      ...
    </div>
  );
}
```

Update `EmptyState` similarly:
```tsx
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
      ...
    </div>
  );
}
```

Update `ErrorState`:
```tsx
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-6 border border-red-500/20"
      style={{
        background: "var(--color-surface)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        border: "1px solid rgba(239,68,68,0.15)",
      }}
    >
      ...
    </div>
  );
}
```

---

### Task 10: 更新 GlassPanel 组件

**Files:**
- Modify: `src/components/ui/GlassPanel.tsx`

- [ ] **Step 1: Add explicit glass styles**

```tsx
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
```

Remove the `glass-panel` CSS class dependency — all styling is now explicit via inline styles using CSS variables.

---

### Task 11: 更新首页 page.tsx

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Enhance homepage hero section with glass+glow**

Find the hero panel div (the one with `glass-panel` class). Replace the hardcoded accent gradient with CSS variable references:

The hero already uses `var(--color-accent-grad)` and `var(--color-accent-glow)` — this should work automatically with the theme system. Just ensure the glass-panel class is properly replaced with inline glass styles.

Change:
```tsx
        <div className="relative overflow-hidden rounded-3xl glass-panel p-10 md:p-14 text-center animate-fade-in">
```

To:
```tsx
        <div
          className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center animate-fade-in"
          style={{
            background: "var(--color-surface)",
            backdropFilter: "blur(24px) saturate(150%)",
            WebkitBackdropFilter: "blur(24px) saturate(150%)",
            border: "1px solid var(--color-border)",
          }}
        >
```

---

### Task 12: 构建验证

- [ ] **Step 1: TypeScript 检查**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Dev server test**

```bash
npm run dev
```

- Open browser, verify:
  - Sidebar has glass background with blur
  - ThemeSwitcher shows 4 color dots
  - Clicking theme dots changes accent color site-wide
  - Custom color picker works (shows hex, apply changes)
  - Background ambient glow shifts with accent color
  - Mouse movement subtly moves glow positions
  - Tool cards have frosted glass appearance
  - All glass surfaces show noise texture on close inspection
  - Refresh page — theme persists
