"use client";

const COLORS = [
  "#ffffff",
  "#ff4444",
  "#ff8800",
  "#ffdd44",
  "#44cc44",
  "#44aaff",
  "#4488ff",
  "#8844ff",
  "#ff44ff",
  "#888888",
  "#555555",
  "#222222",
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-1.5">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`颜色 ${c}`}
          title={c}
          className={`w-5 h-5 rounded-full border-2 transition-all ${
            c === color
              ? "border-[var(--color-accent)] scale-110"
              : "border-transparent hover:scale-110"
          }`}
          style={{ backgroundColor: c }}
          onClick={() => onChange(c)}
        />
      ))}
      <label className="relative w-5 h-5 rounded-full overflow-hidden cursor-pointer ml-1">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-full h-full rounded-full border border-black/20 bg-gradient-to-br from-pink-400 via-purple-400 to-cyan-400" />
      </label>
    </div>
  );
}
