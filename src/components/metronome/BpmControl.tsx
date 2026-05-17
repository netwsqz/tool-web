"use client";

import { useState, useCallback } from "react";

export function BpmControl({
  bpm,
  onBpmChange,
}: {
  bpm: number;
  onBpmChange: (bpm: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(bpm));

  const commitInput = useCallback(() => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num)) {
      onBpmChange(num);
    }
    setEditing(false);
  }, [inputValue, onBpmChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commitInput();
      if (e.key === "Escape") {
        setInputValue(String(bpm));
        setEditing(false);
      }
    },
    [commitInput, bpm]
  );

  return (
    <div className="space-y-3">
      {/* BPM 数字显示 / 输入 */}
      <div className="text-center">
        {editing ? (
          <input
            type="number"
            min={20}
            max={300}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={commitInput}
            onKeyDown={handleKeyDown}
            className="text-6xl font-bold tracking-tighter w-40 text-center
              bg-transparent border-b-2 border-[var(--color-accent)]
              text-[var(--color-text-primary)] outline-none
              [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setInputValue(String(bpm));
              setEditing(true);
            }}
            className="text-6xl font-bold tracking-tighter text-[var(--color-text-primary)]
              hover:text-[var(--color-accent)] transition-colors cursor-pointer"
          >
            {bpm}
          </button>
        )}
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">BPM</p>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={20}
        max={300}
        value={bpm}
        onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
          bg-white/10
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[var(--color-accent)]
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:duration-100
          [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </div>
  );
}
