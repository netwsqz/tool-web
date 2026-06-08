# Music Player Layout Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix ImmersiveLayout right panel from flex-1+shrink-0 (control bar bottom-stuck) to fixed ratio split (62.5%/37.5%) with non-zero bottom margin.

**Architecture:** Single file change in `ImmersiveLayout.tsx`. Swap Tailwind classes on right panel container, lyrics container, and control bar container. No new components, no behavior changes.

**Tech Stack:** React + Tailwind CSS v4

---

### Task 1: Adjust ImmersiveLayout flex ratios

**Files:**
- Modify: `src/components/music-player/ImmersiveLayout.tsx`

- [ ] **Step 1: Change right panel container className**

Current:
```
className="relative z-10 flex-1 flex-col min-h-0 lg:min-h-0"
```

Change to:
```
className="relative z-10 flex-1 flex-col h-full min-h-0"
```

- [ ] **Step 2: Change lyrics area className**

Current:
```
<div className="flex-1 min-h-0">
```

Change to:
```
<div className="flex-[5] min-h-0 pb-2">
```

- [ ] **Step 3: Change control bar className**

Current:
```
className="shrink-0 rounded-2xl lg:rounded-3xl px-4 pb-4 pt-3 lg:px-6 lg:pb-6 lg:pt-4 space-y-3"
```

Add flex-[3] and mb-6/lg:mb-8 (bottom margin) for non-sticky bottom:

Before: `shrink-0 `
After: `flex-[3] mb-6 lg:mb-8 `

Result:
```
className="flex-[3] mb-6 lg:mb-8 rounded-2xl lg:rounded-3xl px-4 pb-4 pt-3 lg:px-6 lg:pb-6 lg:pt-4 space-y-3"
```

- [ ] **Step 4: Reduce mobile vinyl min-height**

Current:
```
<div className="relative z-10 flex flex-col items-center justify-center gap-6 py-8 lg:py-0 lg:w-[45%] min-h-[40vh] lg:min-h-0">
```

Change `min-h-[40vh]` to `min-h-[35vh]`:

```
<div className="relative z-10 flex flex-col items-center justify-center gap-6 py-8 lg:py-0 lg:w-[45%] min-h-[35vh] lg:min-h-0">
```

- [ ] **Step 5: Verify with build**

```bash
npx next build --no-lint 2>&1 | tail -20
```

Expected: No build errors.
