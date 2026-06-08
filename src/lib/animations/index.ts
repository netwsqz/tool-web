// animations/index.ts — Pure CSS animation helpers. GSAP has been removed.
// Visual effects are handled by CSS transitions and keyframes defined in globals.css.

export function drawerOpen(backdrop: HTMLElement | null, panel: HTMLElement | null) {
  if (backdrop) { backdrop.style.visibility = "visible"; backdrop.style.opacity = "1"; }
  if (panel) panel.style.transform = "translateX(0)";
  return { kill() {}, play() {}, pause() {}, resume() {}, eventCallback(_ev: string, _cb: () => void) { return this; } };
}

export function drawerClose(backdrop: HTMLElement | null, panel: HTMLElement | null) {
  if (panel) panel.style.transform = "translateX(-100%)";
  if (backdrop) backdrop.style.opacity = "0";
  return {
    kill() {}, play() {}, pause() {}, resume() {},
    eventCallback(_ev: string, cb: () => void) {
      setTimeout(() => { if (backdrop) backdrop.style.visibility = "hidden"; cb(); }, 260);
      return this;
    }
  };
}