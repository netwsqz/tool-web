"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MetronomeEngine } from "@/lib/audio/engine";

export function useMetronome(initialBpm = 120) {
  const engineRef = useRef<MetronomeEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState(initialBpm);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const tapRef = useRef<number[]>([]);
  const [tapBpm, setTapBpm] = useState<number | null>(null);

  // 初始化引擎（仅一次）
  useEffect(() => {
    const engine = new MetronomeEngine(initialBpm);
    engine.setOnBeat((beat) => setCurrentBeat(beat));
    engineRef.current = engine;
    return () => engine.destroy();
  }, [initialBpm]);

  // currentBeat 有一个小技巧：当节拍器停止时重置为 -1
  const play = useCallback(() => {
    engineRef.current?.start();
    setIsPlaying(true);
    setCurrentBeat(0);
  }, []);

  const pause = useCallback(() => {
    engineRef.current?.stop();
    setIsPlaying(false);
    setCurrentBeat(-1);
  }, []);

  const toggle = useCallback(() => {
    if (engineRef.current?.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const setBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(20, Math.min(300, Math.round(newBpm)));
    setBpmState(clamped);
    engineRef.current?.setBpm(clamped);
  }, []);

  const tap = useCallback(() => {
    const now = Date.now();
    const taps = [...tapRef.current, now];
    // 只保留最近 5 次点击
    const recent = taps.slice(-5);
    tapRef.current = recent;

    const result = MetronomeEngine.calculateTapBpm(recent);
    if (result !== null) {
      setTapBpm(result);
      setBpm(result);
    }
  }, [setBpm]);

  return {
    isPlaying,
    bpm,
    currentBeat,
    tapBpm,
    play,
    pause,
    toggle,
    setBpm,
    tap,
  };
}
