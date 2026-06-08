"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Instrument } from "@/types/piano";

type PianoControlBarProps = {
  instrument: Instrument;
  volume: number;
  showLabels: boolean;
  recording: boolean;
  baseOctave: number;
  onInstrumentChange: (inst: Instrument) => void;
  onVolumeChange: (v: number) => void;
  onToggleLabels: () => void;
  onToggleRecording: () => void;
  onClearAll: () => void;
};

const INSTRUMENTS: { key: Instrument; label: string }[] = [
  { key: "piano", label: "三角钢琴" },
  { key: "synth", label: "合成器" },
  { key: "strings", label: "弦乐" },
];

export function PianoControlBar({
  instrument,
  volume,
  showLabels,
  recording,
  baseOctave,
  onInstrumentChange,
  onVolumeChange,
  onToggleLabels,
  onToggleRecording,
  onClearAll,
}: PianoControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Instrument selector */}
      <div className="flex gap-0.5 bg-black/5 rounded-lg p-0.5">
        {INSTRUMENTS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onInstrumentChange(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              instrument === key
                ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                : "text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] hover:bg-black/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Volume slider */}
      <div className="flex items-center gap-2">
        <svg
          className="size-4 text-[var(--color-foreground-muted)] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {volume > 0 && (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              {volume > 0.5 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
            </>
          )}
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-24 h-1.5 rounded-full appearance-none cursor-pointer
            bg-black/10 accent-[var(--color-accent)]
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:size-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-[var(--color-accent)]
            [&::-webkit-slider-thumb]:shadow-sm"
          aria-label="音量"
        />
        <span className="text-xs text-[var(--color-foreground-muted)] w-8 text-right tabular-nums">
          {Math.round(volume * 100)}
        </span>
      </div>

      {/* Labels toggle */}
      <button
        onClick={onToggleLabels}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          showLabels
            ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
            : "bg-black/5 text-[var(--color-foreground-muted)] hover:bg-black/10"
        }`}
        title="显示键位标签"
      >
        Aa
      </button>

      {/* Panic: clear all ringing notes */}
      <button
        onClick={onClearAll}
        className="px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
          bg-black/5 text-[var(--color-foreground-muted)] hover:bg-[var(--color-destructive)]/20 hover:text-[var(--color-destructive)]"
        title="一键静音（停止所有发声）"
      >
        ✕
      </button>

      {/* Recording placeholder */}
      <div className="flex items-center gap-1.5 opacity-40 cursor-not-allowed">
        <span className="size-2 rounded-full bg-[var(--color-destructive)]" />
        <span className="text-xs text-[var(--color-foreground-muted)]">录音</span>
      </div>

      {/* Octave indicator */}
      <div className="flex items-center gap-1 text-xs text-[var(--color-foreground-muted)]">
        <span className="tabular-nums">C{baseOctave}</span>
        <span className="text-[var(--color-foreground-subtle)]">~</span>
        <span className="tabular-nums">C{baseOctave + 2}</span>
      </div>

      {/* MIDI placeholder */}
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 text-[var(--color-foreground-subtle)] opacity-40 cursor-not-allowed">
        MIDI
      </span>
    </div>
  );
}

export { INSTRUMENTS };
