"use client";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      style={{
        animation: "fade-in 250ms cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      {children}
    </div>
  );
}
