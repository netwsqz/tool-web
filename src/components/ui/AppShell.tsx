"use client";

import { useState, useEffect } from "react";
import { Sidebar, SidebarToggle } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  const handleNavigate = () => setSidebarOpen(false);

  // Close sidebar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible; mobile: overlay */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-60
          bg-[var(--color-bg-elevated)] border-r border-[var(--color-border)]
          transition-transform duration-300 ease-[var(--easing-smooth)]
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <Sidebar onNavigate={handleNavigate} />
      </aside>

      {/* Mobile toggle button */}
      <SidebarToggle open={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main content */}
      <main className="flex-1 min-w-0 relative z-10 pt-12 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
