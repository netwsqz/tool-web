export type Instrument = "piano" | "synth" | "strings";

export interface PianoKeyData {
  note: string;
  midi: number;
  type: "white" | "black";
  octave: number;
  /** Index of the white key within the octave (0=C..6=B). Only meaningful for white keys. */
  whiteKeyIndex?: number;
  /** Keyboard letter that maps to this note */
  keyLabel?: string;
}

export const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

/** Maps white key note names to their index 0-6 within an octave */
export const WHITE_KEY_INDEX: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

/** For each black key, which white key index it sits between */
export const BLACK_KEY_WHITE_INDEX: Record<string, number> = {
  "C#": 0, "D#": 1, "F#": 3, "G#": 4, "A#": 5,
};

/**
 * Two-row computer keyboard mapping covering 2 full octaves.
 *
 * Lower row: Z-M (C-B of base octave)  — white & black keys on home row
 * Upper row: Q-I (C-B of 2nd octave + top C) — white & black keys on QWERTY row
 */
export const KEYBOARD_MAP: Record<string, { semitone: number; octaveOffset: number }> = {
  // ── Lower row (base octave) ──
  z: { semitone: 0, octaveOffset: 0 },   // C     (white, pinky)
  s: { semitone: 1, octaveOffset: 0 },   // C#    (black)
  x: { semitone: 2, octaveOffset: 0 },   // D     (white, ring)
  d: { semitone: 3, octaveOffset: 0 },   // D#    (black)
  c: { semitone: 4, octaveOffset: 0 },   // E     (white, middle)
  v: { semitone: 5, octaveOffset: 0 },   // F     (white, index)
  g: { semitone: 6, octaveOffset: 0 },   // F#    (black)
  b: { semitone: 7, octaveOffset: 0 },   // G     (white, index)
  h: { semitone: 8, octaveOffset: 0 },   // G#    (black)
  n: { semitone: 9, octaveOffset: 0 },   // A     (white, index)
  j: { semitone: 10, octaveOffset: 0 },  // A#    (black)
  m: { semitone: 11, octaveOffset: 0 },  // B     (white, index)
  // ── Upper row (base octave + 1) ──
  q: { semitone: 0, octaveOffset: 1 },   // C     (white, pinky)
  "2": { semitone: 1, octaveOffset: 1 }, // C#    (black)
  w: { semitone: 2, octaveOffset: 1 },   // D     (white, ring)
  "3": { semitone: 3, octaveOffset: 1 }, // D#    (black)
  e: { semitone: 4, octaveOffset: 1 },   // E     (white, middle)
  r: { semitone: 5, octaveOffset: 1 },   // F     (white, index)
  "5": { semitone: 6, octaveOffset: 1 }, // F#    (black)
  t: { semitone: 7, octaveOffset: 1 },   // G     (white, index)
  "6": { semitone: 8, octaveOffset: 1 }, // G#    (black)
  y: { semitone: 9, octaveOffset: 1 },   // A     (white, index)
  "7": { semitone: 10, octaveOffset: 1 },// A#    (black)
  u: { semitone: 11, octaveOffset: 1 },  // B     (white, index)
  i: { semitone: 0, octaveOffset: 2 },   // C     (top, extra white key)
};

/**
 * Convert note name to MIDI number.
 * e.g. "C3" → 48, "C#3" → 49, "B4" → 71
 */
export function noteToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) throw new Error(`Invalid note: ${note}`);
  const name = match[1];
  const octave = parseInt(match[2], 10);
  const semitone = NOTE_NAMES.indexOf(name as typeof NOTE_NAMES[number]);
  if (semitone === -1) throw new Error(`Invalid note name: ${name}`);
  return (octave + 1) * 12 + semitone;
}

/**
 * Generate key data for a range of octaves (inclusive).
 * e.g. generateKeys(3, 4) → C3 to B4
 */
export function generateKeys(startOctave: number, endOctave: number): PianoKeyData[] {
  const keys: PianoKeyData[] = [];
  for (let octave = startOctave; octave <= endOctave; octave++) {
    for (let s = 0; s < 12; s++) {
      const name = NOTE_NAMES[s];
      const note = `${name}${octave}`;
      const isSharp = name.includes("#");
      if (isSharp) {
        keys.push({
          note,
          midi: (octave + 1) * 12 + s,
          type: "black",
          octave,
        });
      } else {
        keys.push({
          note,
          midi: (octave + 1) * 12 + s,
          type: "white",
          octave,
          whiteKeyIndex: WHITE_KEY_INDEX[name],
        });
      }
    }
  }
  return keys;
}

/**
 * Generate keyboard letter labels for a given base octave.
 * Returns a map of note → keyboard key (uppercase).
 */
export function generateKeyLabels(baseOctave: number): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [key, { semitone, octaveOffset }] of Object.entries(KEYBOARD_MAP)) {
    const noteOctave = baseOctave + octaveOffset;
    const note = `${NOTE_NAMES[semitone]}${noteOctave}`;
    labels[note] = key.toUpperCase();
  }
  return labels;
}
