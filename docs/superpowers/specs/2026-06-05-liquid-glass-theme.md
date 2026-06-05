# Liquid Glass 全站毛玻璃主题系统

**日期**: 2026-06-05
**状态**: 已批准设计

## 概述

将全站 UI 改造为音乐播放器同款毛玻璃透明风格（Liquid Glass），同时实现可切换的主题系统。用户可选择 4 套预设主题或通过颜色选择器自定义强调色。

## 设计目标

- 全站统一毛玻璃质感（`backdrop-filter: blur(24~32px)` + 低透明度表面）
- 4 套预设主题 + 自定义强调色
- 沉浸式环境光效 + 鼠标追踪
- 主题偏好持久化（localStorage）
- 与现有 CSS 变量体系完全兼容

## 技术方案：CSS 变量切换（方案 A）

### ThemeProvider Context

```
src/contexts/ThemeProvider.tsx   ← 主题上下文
src/lib/theme/themes.ts         ← 4 组主题变量定义
src/lib/theme/storage.ts        ← localStorage 读写
```

#### 主题变量结构

每个主题定义一组 CSS 变量，挂载到 `<html style="...">`：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--color-accent` | `#5e6ad2` | 强调色 |
| `--color-accent-hover` | `#7c86e0` | hover 态 |
| `--color-accent-glow` | `rgba(94,106,210,0.2)` | 辉光 |
| `--color-accent-grad` | `linear-gradient(135deg, #5e6ad2, #8b5cf6)` | 渐变 |
| `--color-surface` | `rgb(255 255 255 / 0.035)` | 玻璃表面（比音乐播放器更透） |
| `--color-surface-hover` | `rgb(255 255 255 / 0.06)` | 玻璃 hover |
| `--color-border` | `rgba(255,255,255,0.06)` | 玻璃边框 |

自定义强调色覆盖：用户通过 `<input type="color">` 选择后，覆盖 `--color-accent` 及衍生变量的 auto-calc 值。

### 4 套预设主题

| 主题 | 强调色 | 强调色 Hover | 渐变方向 |
|------|--------|-------------|----------|
| 经典蓝 | `#5e6ad2` | `#7c86e0` | `→ #8b5cf6` |
| 暖琥珀 | `#d4a04a` | `#e8b86a` | `→ #cd7f32` |
| 翡翠绿 | `#34d399` | `#6ee7b7` | `→ #0891b2` |
| 玫瑰红 | `#f43f5e` | `#fb7185` | `→ #e11d48` |

### 主题切换器

- 位置：侧边栏底部
- UI：4 个圆形色板 + `<input type="color">` + 当前选中指示
- 切换效果：CSS 变量过渡（`transition: color 0.3s ease`）

## 组件改造清单

### 第一阶段：基础设施

| 文件 | 改动 |
|------|------|
| `src/globals.css` | 更新 `--color-surface` 从 `0.05` 到 `0.035`；添加 CSS 噪点纹理 `body::after`；添加环境辉光渐变 |
| `src/components/ui/AppShell.tsx` | 增强鼠标追踪环境光效果；添加噪点纹理层 |
| `src/contexts/ThemeProvider.tsx` | **新建** — 主题上下文+切换逻辑 |
| `src/lib/theme/themes.ts` | **新建** — 4 组主题变量定义 |
| `src/lib/theme/storage.ts` | **新建** — localStorage 持久化 |
| `src/components/ui/ThemeSwitcher.tsx` | **新建** — 色球选择器 + color input |
| `src/components/ui/ThemeSwitcher.css` | **新建** — 主题切换器样式 |
| `src/app/layout.tsx` | 包裹 ThemeProvider |

### 第二阶段：核心 UI 组件

| 文件 | 改动 |
|------|------|
| `src/components/ui/GlassPanel.tsx` | 增强玻璃效果 |
| `src/components/ui/Sidebar.tsx` | 毛玻璃背景 + 底部添加主题切换器 |
| `src/components/ui/ToolCard.tsx` | 增强毛玻璃+辉光悬停效果 |
| `src/components/ui/ToolLayout.tsx` | 头部毛玻璃化；LoadingState/EmptyState/ErrorState 增强玻璃效果 |

### 第三阶段：各工具页面（统一毛玻璃风格）

各工具页面的内容面板/卡片改毛玻璃。主要通过 ToolLayout 统一传递玻璃样式，无需逐页改造——已有 GlassPanel 的地方自动增效。

### 第四阶段：主题切换器集成

侧边栏底部添加 ThemeSwitcher 组件，包括：
- 4 个主题色球（当前选中高亮边框）
- 自定义颜色 `<input type="color">`（预览当前色值）
- "重置"按钮（回到主题预设色）

## 主题色环境辉光（凸显毛玻璃）

关键设计决策：背景添加随主题色变化的大面积柔光渐变，毛玻璃表面透出这些光晕 → 玻璃质感一目了然。

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    /* 主辉光 — 左上角，使用主题强调色，大范围柔光 */
    radial-gradient(ellipse 80% 50% at 20% 10%, var(--color-accent-glow), transparent 60%),
    /* 副辉光 — 右下，次要颜色衍生 */
    radial-gradient(ellipse 50% 50% at 80% 80%, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 50%),
    /* 第三辉光 — 左下 */
    radial-gradient(ellipse 40% 40% at 20% 80%, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

当用户切换主题时：
- 经典蓝 → 蓝紫色环境辉光
- 暖琥珀 → 金色温暖光晕
- 翡翠绿 → 青色冷光
- 玫瑰红 → 粉红光晕

玻璃面板（`rgba(255,255,255,0.035)` + `blur(24px)`）叠加在这些彩色光晕上 → 颜色透过玻璃形成微妙的折射感。

## CSS 噪点纹理

增加微妙的模拟噪点，增强玻璃深度：

```css
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

## 玻璃样式更新

```
/* 更透的玻璃表面 */
--color-surface: rgb(255 255 255 / 0.035);   /* 原 0.05 → 更透 */
```

## CSS 变量过渡

为避免切换主题时颜色突变，在 `:root` 和 `*` 级别添加过渡：

```css
* { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.15s ease; }
```

## 存储结构

```typescript
// localStorage
theme-pref: string      // "blue" | "amber" | "emerald" | "rose" | "custom"
theme-accent: string    // "#5e6ad2" (自定义时存储具体色值)
```

## 验证

- TypeScript 无错误
- 构建通过
- 各主题切换时所有组件颜色正确更新
- 自定义颜色覆盖生效
- localStorage 读写正常
- 刷新后主题保持
