"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PianoKey } from "@/components/piano/PianoKey";
import { generateKeys, generateKeyLabels, WHITE_KEY_INDEX } from "@/types/piano";

const WHITE_HEIGHT = 150;
const BLACK_HEIGHT = 90;
const MIN_WHITE_WIDTH = 32;
const MAX_WHITE_WIDTH = 72;

type PianoKeyboardProps = {
  activeNotes: Set<string>;
  showLabels: boolean;
  baseOctave: number;
  onNoteOn: (note: string) => void;
  onNoteOff: (note: string) => void;
};

export function PianoKeyboard({
  activeNotes,
  showLabels,
  baseOctave,
  onNoteOn,
  onNoteOff,
}: PianoKeyboardProps) {
  const overflowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef(false);
  const currentNoteRef = useRef<string | null>(null);

  const keys = useMemo(() => {
    const base = generateKeys(baseOctave, baseOctave + 1);
    base.push({
      note: `C${baseOctave + 2}`,
      midi: (baseOctave + 2 + 1) * 12,
      type: "white" as const,
      octave: baseOctave + 2,
      whiteKeyIndex: 0,
    });
    return base;
  }, [baseOctave]);
  const whiteKeys = useMemo(() => keys.filter((k) => k.type === "white"), [keys]);
  const blackKeys = useMemo(() => keys.filter((k) => k.type === "black"), [keys]);

  const keyLabels = useMemo(() => generateKeyLabels(baseOctave), [baseOctave]);

  const whiteKeysCount = whiteKeys.length;

  // Dynamically size white keys to fill available container width
  const [whiteKeyWidth, setWhiteKeyWidth] = useState(46);

  useEffect(() => {
    const el = overflowRef.current;
    if (!el) return;

    const updateWidth = () => {
      const available = el.clientWidth;
      const computed = Math.max(
        MIN_WHITE_WIDTH,
        Math.min(MAX_WHITE_WIDTH, available / whiteKeysCount),
      );
      setWhiteKeyWidth(computed);
    };

    updateWidth();

    const ro = new ResizeObserver(() => updateWidth());
    ro.observe(el);
    return () => ro.disconnect();
  }, [whiteKeysCount]);

  const totalWidth = whiteKeys.length * whiteKeyWidth;
  const blackKeyWidth = whiteKeyWidth * (28 / 46);

  // Compute black key positions using dynamic white key width
  const blackKeyPositions = useMemo(() => {
    const map: Record<string, number> = {};
    for (const key of blackKeys) {
      const noteName = key.note.replace(/\d+$/, "") as keyof typeof WHITE_KEY_INDEX;
      const wi = WHITE_KEY_INDEX[noteName.replace("#", "")] ?? 0;
      const octaveWhiteOffset = (key.octave - baseOctave) * 7;
      const pos = (octaveWhiteOffset + wi + 0.65) * whiteKeyWidth - blackKeyWidth / 2;
      map[key.note] = pos;
    }
    return map;
  }, [blackKeys, whiteKeyWidth, blackKeyWidth, baseOctave]);

  const getNoteFromPoint = useCallback((clientX: number, clientY: number): string | null => {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const el of elements) {
      const note = (el as HTMLElement).dataset.note;
      if (note) return note;
    }
    return null;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const note = getNoteFromPoint(e.clientX, e.clientY);
      if (note) {
        onNoteOn(note);
        pointerDownRef.current = true;
        currentNoteRef.current = note;
      }
    },
    [getNoteFromPoint, onNoteOn],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerDownRef.current) return;
      const note = getNoteFromPoint(e.clientX, e.clientY);
      if (note && note !== currentNoteRef.current) {
        if (currentNoteRef.current) onNoteOff(currentNoteRef.current);
        onNoteOn(note);
        currentNoteRef.current = note;
      }
    },
    [getNoteFromPoint, onNoteOn, onNoteOff],
  );

  const handlePointerUp = useCallback(() => {
    if (currentNoteRef.current) {
      onNoteOff(currentNoteRef.current);
    }
    pointerDownRef.current = false;
    currentNoteRef.current = null;
  }, [onNoteOff]);

  const handlePointerLeave = useCallback(() => {
    if (currentNoteRef.current) {
      onNoteOff(currentNoteRef.current);
    }
    pointerDownRef.current = false;
    currentNoteRef.current = null;
  }, [onNoteOff]);

  // Global pointerup to catch releases outside the keyboard
  useEffect(() => {
    const onUp = () => handlePointerUp();
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, [handlePointerUp]);

  return (
    <div
      ref={overflowRef}
      className="overflow-x-auto pb-1 select-none touch-none"
      role="application"
      aria-label="钢琴键盘"
    >
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{ width: totalWidth, height: WHITE_HEIGHT }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* White keys */}
        <div className="flex" style={{ height: WHITE_HEIGHT }}>
          {whiteKeys.map((key) => (
            <PianoKey
              key={key.note}
              note={key.note}
              type="white"
              isActive={activeNotes.has(key.note)}
              label={keyLabels[key.note]}
              showLabel={showLabels}
              style={{ width: whiteKeyWidth, height: WHITE_HEIGHT }}
            />
          ))}
        </div>

        {/* Black keys */}
        {blackKeys.map((key) => (
          <PianoKey
            key={key.note}
            note={key.note}
            type="black"
            isActive={activeNotes.has(key.note)}
            label={keyLabels[key.note]}
            showLabel={showLabels}
            style={{
              position: "absolute",
              left: blackKeyPositions[key.note],
              top: 0,
              width: blackKeyWidth,
              height: BLACK_HEIGHT,
              zIndex: 10,
            }}
          />
        ))}
      </div>
    </div>
  );
}
