import type { Instrument } from "@/types/piano";

const MAX_POLYPHONY = 24;

let cachedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!cachedCtx || cachedCtx.state === "closed") {
    cachedCtx = new AudioContext();
  }
  return cachedCtx;
}

/** Ensure AudioContext is resumed (must be called from user gesture) */
function resumeContext() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();
}

type ActiveNote = {
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  releaseTimer: ReturnType<typeof setTimeout> | null;
};

/**
 * Web Audio API piano synthesis engine.
 * Handles instrument presets, volume, and note lifecycle.
 */
export class PianoEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private activeNotes: Map<string, ActiveNote> = new Map();
  private noteOrder: string[] = [];
  private _volume = 0.7;
  private _instrument: Instrument = "piano";

  constructor() {
    this.ctx = getAudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._volume;
    this.masterGain.connect(this.ctx.destination);
  }

  get volume() {
    return this._volume;
  }
  get instrument() {
    return this._instrument;
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
  }

  setInstrument(type: Instrument) {
    this._instrument = type;
  }

  /**
   * Start playing a note.
   * @param note  e.g. "C3", "F#4"
   * @param velocity  0-1
   */
  noteOn(note: string, velocity = 0.8) {
    // Allow retrigger during release phase (rapid same-note presses)
    if (this.activeNotes.has(note)) {
      this.forceStopNote(note);
    }

    // Polyphony limit: stop the oldest note
    if (this.activeNotes.size >= MAX_POLYPHONY) {
      const oldest = this.noteOrder[0];
      if (oldest) this.forceStopNote(oldest);
    }

    resumeContext();
    const ctx = this.ctx;
    const freq = PianoEngine.noteToFrequency(note);
    const now = ctx.currentTime;
    const presets = this.buildPreset(this._instrument, freq, velocity, now);

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];

    for (const { osc, gain } of presets) {
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      oscillators.push(osc);
      gainNodes.push(gain);
    }

    this.activeNotes.set(note, { oscillators, gainNodes, releaseTimer: null });
    this.noteOrder.push(note);
  }

  /**
   * Stop playing a note with a click-free exponential fadeout.
   */
  noteOff(note: string) {
    const active = this.activeNotes.get(note);
    if (!active) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const releaseDuration = this.getReleaseDuration(this._instrument);
    // Time constant such that gain reaches ~0 after 4 constants
    const timeConstant = releaseDuration * 0.25;

    for (const gain of active.gainNodes) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.setTargetAtTime(0, now, timeConstant);
    }

    // Schedule full cleanup after the fadeout is effectively complete
    const timer = setTimeout(() => {
      for (let i = 0; i < active.oscillators.length; i++) {
        try { active.oscillators[i].stop(); } catch { /* already stopped */ }
        try { active.oscillators[i].disconnect(); } catch { /* already disconnected */ }
        try { active.gainNodes[i].disconnect(); } catch { /* already disconnected */ }
      }
      // Guard: only delete if this exact note hasn't been retriggered
      if (this.activeNotes.get(note) === active) {
        this.activeNotes.delete(note);
        this.removeFromNoteOrder(note);
      }
    }, releaseDuration * 1000 + 100);

    active.releaseTimer = timer;
  }

  /**
   * Immediately silence all active notes.
   * Uses a very fast 5ms gain ramp to avoid clicks, then immediately clears
   * the activeNotes map so retrigger works right away.
   */
  clearAllNotes() {
    if (this.activeNotes.size === 0) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;

    for (const [, active] of this.activeNotes) {
      if (active.releaseTimer) clearTimeout(active.releaseTimer);
      for (const gain of active.gainNodes) {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          // 5ms ramp to 0 — fast but click-free
          gain.gain.linearRampToValueAtTime(0, now + 0.005);
        } catch { /* node may already be disconnected */ }
      }
    }

    // Swap to a new Map so activeNotes is immediately available for retrigger
    const oldNotes = this.activeNotes;
    this.activeNotes = new Map();
    this.noteOrder = [];

    // Clean up old oscillators in background
    setTimeout(() => {
      for (const [, active] of oldNotes) {
        for (let i = 0; i < active.oscillators.length; i++) {
          try { active.oscillators[i].stop(); } catch { /* already stopped */ }
          try { active.oscillators[i].disconnect(); } catch { /* already disconnected */ }
          try { active.gainNodes[i].disconnect(); } catch { /* already disconnected */ }
        }
      }
    }, 20);
  }

  /** Stop all notes immediately (engine teardown) */
  destroy() {
    this.clearAllNotes();
    try { this.masterGain.disconnect(); } catch { /* ignore */ }
  }

  private forceStopNote(note: string) {
    const active = this.activeNotes.get(note);
    if (!active) return;

    if (active.releaseTimer) clearTimeout(active.releaseTimer);
    for (let i = 0; i < active.oscillators.length; i++) {
      try { active.oscillators[i].stop(); } catch { /* already stopped */ }
      try { active.oscillators[i].disconnect(); } catch { /* already disconnected */ }
      try { active.gainNodes[i].disconnect(); } catch { /* already disconnected */ }
    }
    this.activeNotes.delete(note);
    this.removeFromNoteOrder(note);
  }

  private removeFromNoteOrder(note: string) {
    const idx = this.noteOrder.indexOf(note);
    if (idx > -1) this.noteOrder.splice(idx, 1);
  }

  private getReleaseDuration(instr: Instrument): number {
    switch (instr) {
      case "piano": return 0.4;
      case "synth": return 0.15;
      case "strings": return 0.6;
    }
  }

  private buildPreset(
    instr: Instrument,
    freq: number,
    velocity: number,
    now: number,
  ): { osc: OscillatorNode; gain: GainNode }[] {
    const ctx = this.ctx;
    const v = velocity;

    switch (instr) {
      case "piano":
        return this.buildPianoVoice(ctx, freq, v, now);
      case "synth":
        return this.buildSynthVoice(ctx, freq, v, now);
      case "strings":
        return this.buildStringsVoice(ctx, freq, v, now);
    }
  }

  /** Grand Piano: 3 sine oscillators (fundamental + 2nd/3rd harmonics) */
  private buildPianoVoice(
    ctx: AudioContext, freq: number, v: number, now: number,
  ) {
    const harmonics = [
      { ratio: 1, gain: 1.0 },
      { ratio: 2, gain: 0.3 },
      { ratio: 3, gain: 0.12 },
    ];

    return harmonics.map(({ ratio, gain: hGain }) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * ratio;

      const gain = ctx.createGain();
      // Quick attack, piano-like exponential decay to sustain
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(v * hGain, now + 0.005);
      gain.gain.setTargetAtTime(v * hGain * 0.35, now + 0.005, 0.08);

      return { osc, gain };
    });
  }

  /** Synth: sawtooth with pitch bend + sub oscillator */
  private buildSynthVoice(
    ctx: AudioContext, freq: number, v: number, now: number,
  ) {
    const result: { osc: OscillatorNode; gain: GainNode }[] = [];

    // Main sawtooth with pitch envelope
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq * 1.08, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(v * 0.8, now + 0.003);
    gain.gain.setTargetAtTime(v * 0.6, now + 0.003, 0.04);

    result.push({ osc, gain });

    // Sub oscillator (square, one octave down)
    const sub = ctx.createOscillator();
    sub.type = "square";
    sub.frequency.value = freq * 0.5;

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(v * 0.2, now + 0.01);

    result.push({ osc: sub, gain: subGain });

    return result;
  }

  /** Strings: detuned sawtooth pair */
  private buildStringsVoice(
    ctx: AudioContext, freq: number, v: number, now: number,
  ) {
    const detune = freq * 0.005;

    return [
      { detune: -detune, gainMul: 0.5 },
      { detune: detune, gainMul: 0.5 },
    ].map(({ detune: d, gainMul }) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq + d;

      const gain = ctx.createGain();
      // Slow attack with exponential approach
      gain.gain.setValueAtTime(0, now);
      gain.gain.setTargetAtTime(v * gainMul, now, 0.03);
      // Decay to sustain level
      gain.gain.setTargetAtTime(v * gainMul * 0.7, now + 0.3, 0.08);

      return { osc, gain };
    });
  }

  // ── Static utilities ──

  static noteToMidi(note: string): number {
    const match = note.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) throw new Error(`Invalid note: ${note}`);
    const semitoneNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const semitone = semitoneNames.indexOf(match[1]);
    if (semitone === -1) throw new Error(`Invalid note name: ${match[1]}`);
    const octave = parseInt(match[2], 10);
    return (octave + 1) * 12 + semitone;
  }

  static midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  static noteToFrequency(note: string): number {
    return PianoEngine.midiToFrequency(PianoEngine.noteToMidi(note));
  }
}
