# Mobile Sidebar Drawer Adaptation

## Goal
Make the floating-island sidebar collapsible on mobile (`<lg` breakpoint) with a slide-in drawer pattern.

## Changes

### 1. `src/components/ui/Sidebar.tsx`

**Props change:**
- Remove hardcoded `iconMap` (lines 30-47), import from `@/components/ui/iconMap` instead
- Add `open: boolean` and `onClose: () => void` props
- Replace `onNavigate` prop with `onClose`

**Styling changes:**
Wrap the existing `<nav>` in a container div, or add conditional classes:

Desktop (`lg:`): always visible, no transform
```tsx
// current position styles stay for lg+
// Add: className={`... ${!open ? '-translate-x-full' : 'translate-x-0'} lg:translate-x-0 transition-transform duration-300 ease-[var(--easing-smooth)]`}
```

Mobile: the nav slides in/out:
- Closed: `-translate-x-full` (off-screen left)
- Open: `translate-x-0`
- Desktop: always `translate-x-0` regardless of `open` state

**Navigation click closes drawer:**
- In `ToolNavItem` (both active and non-active), call `onClose` on click
- Pass `onClose` down or handle in the Link onClick within Sidebar

**Import changes:**
```tsx
// Remove local iconMap lines
// Add:
import { iconMap } from "@/components/ui/iconMap";
```

### 2. `src/components/ui/AppShell.tsx`

**Add state:**
```tsx
const [sidebarOpen, setSidebarOpen] = useState(false);
```

**Wire SidebarToggle:**
```tsx
<SidebarToggle open={sidebarOpen} onClick={() => setSidebarOpen(o => !o)} />
```

**Add backdrop (mobile only):**
```tsx
{/* Backdrop overlay — lg:hidden */}
<div
  className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
    sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`}
  onClick={() => setSidebarOpen(false)}
  aria-hidden="true"
/>
```

**ESC key listener:**
```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}, [sidebarOpen]);
```

**Body scroll lock:**
```tsx
useEffect(() => {
  if (sidebarOpen) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
  return () => { document.body.style.overflow = ""; };
}, [sidebarOpen]);
```

**Pass props to Sidebar:**
```tsx
<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
```

## Files to modify
- `src/components/ui/Sidebar.tsx` — add props, drawer animation, icon import
- `src/components/ui/AppShell.tsx` — add state, backdrop, ESC, scroll lock

## Not changing
- `SidebarToggle` component — stays as-is
- `globals.css` — no changes needed (Tailwind utilities handle this)
- `tools.ts` — no changes
- No new npm packages

## Acceptance criteria
- [ ] Desktop (`>=1024px`): sidebar always visible, no change from current behavior
- [ ] Mobile (`<1024px`): sidebar hidden by default
- [ ] Hamburger button opens sidebar (slide from left, `translate-x` CSS transition)
- [ ] Backdrop overlay appears when sidebar is open
- [ ] Clicking backdrop closes sidebar
- [ ] Clicking a nav item closes sidebar
- [ ] ESC key closes sidebar
- [ ] Body scroll locked when sidebar is open
- [ ] Smooth transition on open/close (~300ms, ease-smooth)
- [ ] No regression on desktop layout
