"use client";

import { memo } from "react";

type PianoKeyProps = {
  note: string;
  type: "white" | "black";
  isActive: boolean;
  label?: string;
  showLabel?: boolean;
  style?: React.CSSProperties;
};

export const PianoKey = memo(function PianoKey({
  note,
  type,
  isActive,
  label,
  showLabel,
  style,
}: PianoKeyProps) {
  const whiteClass = isActive
    ? "bg-[#7dd3fc] shadow-[0_0_14px_rgba(6,182,212,0.5)]"
    : "bg-[#e8e8e8] hover:bg-[#f0f0f0]";

  const blackClass = isActive
    ? "bg-[#06b6d4] shadow-[0_0_10px_rgba(6,182,212,0.6)]"
    : "bg-[#1a1a1d] hover:bg-[#28282d]";

  const common =
    "relative cursor-pointer select-none transition-colors duration-75 focus:outline-none";

  if (type === "white") {
    return (
      <div
        data-note={note}
        className={`${common} ${whiteClass} w-full h-full rounded-b-md border-r border-black/5 last:border-r-0`}
        style={style}
      >
        {showLabel && label && (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[10px] leading-none text-gray-400/60 font-medium select-none pointer-events-none">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      data-note={note}
      className={`${common} ${blackClass} rounded-b-[4px] border-b-[3px] border-black/30 z-10`}
      style={style}
    >
      {showLabel && label && (
        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] leading-none text-white/40 font-medium select-none pointer-events-none">
          {label}
        </span>
      )}
    </div>
  );
});
