"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

/**
 * Root layout shell with ambient mouse-tracking background motion.
 * The radial gradient body::before subtly shifts with cursor position
 * for an immersive, spatial feel.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });

  // Set initial glow positions on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.setProperty("--glow-x", "20%");
      document.body.style.setProperty("--glow-y", "10%");
      document.body.style.setProperty("--glow-sec-x", "80%");
      document.body.style.setProperty("--glow-sec-y", "80%");
    }
  }, []);

  // ESC key closes sidebar on mobile
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  // Body scroll lock when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    targetRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    };
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  function animate() {
    const cx = currentRef.current;
    const tx = targetRef.current;
    // Smooth follow
    cx.x += (tx.x - cx.x) * 0.05;
    cx.y += (tx.y - cx.y) * 0.05;

    if (typeof document !== "undefined") {
      // Shift the primary glow hotspot with cursor 鈥?wide range for visible effect
      const baseX = 15 + (cx.x - 0.5) * 40;  // -5%鈥?5%
      const baseY = 5 + (cx.y - 0.5) * 30;    // -10%鈥?0%
      document.body.style.setProperty("--glow-x", `${baseX}%`);
      document.body.style.setProperty("--glow-y", `${baseY}%`);

      // Secondary glow moves opposite 鈥?trailing glow
      const secX = 80 + (0.5 - cx.x) * 60;    // 20%鈥?40%
      const secY = 80 + (0.5 - cx.y) * 40;    // 40%鈥?20%
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

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen" onMouseMove={handleMouseMove}>
      {/* Skip to content 鈥?accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--color-accent)] focus:text-white focus:rounded-lg focus:text-sm"
      >
        璺冲埌涓昏鍐呭
      </a>

      {/* Backdrop overlay 鈥?mobile only */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen((o) => !o)}

        className="fixed top-3 left-3 z-[51] size-9 flex items-center justify-center rounded-lg glass-low hover:bg-[var(--color-surface-hover)] transition-colors duration-200 lg:hidden"
        aria-label={sidebarOpen ? "鍏抽棴瀵艰埅" : "鎵撳紑瀵艰埅"}
      >
        {sidebarOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      {/* Floating island sidebar */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* Main content 鈥?full width since sidebar floats above */}
      <main
        id="main-content"

        className="flex-1 min-w-0 relative z-10 pt-12 lg:pl-[calc(var(--sidebar-width)+16px)] lg:pt-0"
      >
        {children}
      </main>
    </div>
  );
}
