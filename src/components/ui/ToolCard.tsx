"use client";

import Link from "next/link";
import type { ToolConfig } from "@/types";
import { iconMap } from "./iconMap";

export default function ToolCard({
  tool,
  index = 0,
}: {
  tool: ToolConfig;
  index?: number;
}) {
  const isActive = tool.status === "active";
  const Icon = iconMap[tool.icon];

  return (
    <Link
      href={isActive ? `/tools/${tool.id}` : "#"}
      className={`block group ${isActive ? "" : "pointer-events-none"}`}
      tabIndex={isActive ? 0 : -1}
    >
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
        {/* Hover glow overlay */}
        <div
          className="absolute inset-0 rounded-[1.75rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, var(--color-accent-glow), transparent 70%)",
          }}
        />
        <div className="flex items-start gap-4 relative z-[1]">
          <div
            className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-[14px] transition-transform duration-300 ${
              isActive ? "motion-safe:group-hover:scale-105" : ""
            }`}
            style={
              isActive
                ? {
                    background: "var(--color-accent-grad)",
                    boxShadow: "0 4px 12px var(--color-accent-glow)",
                  }
                : undefined
            }
          >
            {Icon && (
              <Icon
                className={`w-5 h-5 ${isActive ? "text-white" : ""}`}
                style={
                  !isActive
                    ? { color: "var(--color-foreground-muted)" }
                    : undefined
                }
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="font-semibold text-[15px] truncate"
              style={{ color: "var(--color-foreground)" }}
            >
              {tool.name}
            </h3>
            <p
              className="text-sm mt-1 line-clamp-2"
              style={{ color: "var(--color-foreground-muted)" }}
            >
              {tool.description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
