"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PianoEngine } from "@/lib/audio/piano-engine";
import { KEYBOARD_MAP, NOTE_NAMES } from "@/types/piano";
import type { Instrument } from "@/types/piano";

export function usePiano() {
  const engineRef = useRef<PianoEngine | null>(null);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [volume, setVolumeState] = useState(0.7);
  const [instrument, setInstrumentState] = useState<Instrument>("piano");
  const [showLabels, setShowLabels] = useState(true);
  const [recording, setRecording] = useState(false);
  const [baseOctave, setBaseOctave] = useState(4);

  // Ref-based accessors for event handlers (avoids stale closures)
  const activeNotesRef = useRef<Set<string>>(new Set());
  const baseOctaveRef = useRef(baseOctave);
  const instrumentRef = useRef<Instrument>(instrument);

  baseOctaveRef.current = baseOctave;
  instrumentRef.current = instrument;

  // Init engine
  useEffect(() => {
    const engine = new PianoEngine();
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const clearAllNotes = useCallback(() => {
    engineRef.current?.clearAllNotes();
    activeNotesRef.current = new Set();
    setActiveNotes(new Set());
  }, []);

  const noteOn = useCallback((note: string, velocity = 0.8) => {
    engineRef.current?.noteOn(note, velocity);
    const next = new Set(activeNotesRef.current);
    next.add(note);
    activeNotesRef.current = next;
    setActiveNotes(next);
  }, []);

  const noteOff = useCallback((note: string) => {
    engineRef.current?.noteOff(note);
    const next = new Set(activeNotesRef.current);
    next.delete(note);
    activeNotesRef.current = next;
    setActiveNotes(next);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    engineRef.current?.setVolume(clamped);
  }, []);

  const setInstrument = useCallback((type: Instrument) => {
    clearAllNotes();
    setInstrumentState(type);
    engineRef.current?.setInstrument(type);
  }, [clearAllNotes]);

  const toggleLabels = useCallback(() => {
    setShowLabels((prev) => !prev);
  }, []);

  const toggleRecording = useCallback(() => {
    setRecording((prev) => !prev);
  }, []);

  const shiftOctave = useCallback((delta: number) => {
    clearAllNotes();
    setBaseOctave((prev) => {
      const next = prev + delta;
      if (next < 1 || next > 6) return prev;
      return next;
    });
  }, []);

  // Keyboard event handler (ref-based to avoid re-registration)
  const keyHandlerRef = useRef((_e: KeyboardEvent) => {});

  keyHandlerRef.current = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    const mapping = KEYBOARD_MAP[key];
    if (!mapping) {
      // Octave shift via arrow keys — only on keydown, ignore repeats
      if (e.type === "keydown" && !e.repeat) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          shiftOctave(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          shiftOctave(1);
        }
      }
      return;
    }

    e.preventDefault();

    if (e.type === "keydown" && !e.repeat) {
      const octave = baseOctaveRef.current + mapping.octaveOffset;
      const note = `${NOTE_NAMES[mapping.semitone]}${octave}`;
      noteOn(note);
    } else if (e.type === "keyup") {
      const octave = baseOctaveRef.current + mapping.octaveOffset;
      const note = `${NOTE_NAMES[mapping.semitone]}${octave}`;
      noteOff(note);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyHandlerRef.current(e);
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", handler);
    };
  }, []);

  // Global safety net: clear all notes when window loses focus or tab is hidden
  useEffect(() => {
    const onBlur = () => clearAllNotes();
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [clearAllNotes]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) clearAllNotes();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [clearAllNotes]);

  return {
    activeNotes,
    volume,
    instrument,
    showLabels,
    recording,
    baseOctave,
    noteOn,
    noteOff,
    clearAllNotes,
    setVolume,
    setInstrument,
    toggleLabels,
    toggleRecording,
    shiftOctave,
  };
}
