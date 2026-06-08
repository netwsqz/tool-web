"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { MusicTrack, LyricLine, PlayMode, PlayerState } from "@/types/music-player";
import { PlayerEngine } from "@/lib/audio/player-engine";
import { loadPrefs, savePrefs } from "@/lib/music/player-prefs";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedTrackMeta {
  id: string;
  title: string;
  artist: string;
  album: string;
  format: string;
  duration: number;
  filename: string;
  coverFilename?: string;
  lyrics: LyricLine[];
}

export type UploadError = { filename: string; error: string };

interface MusicPlayerState {
  tracks: MusicTrack[];
  currentTrackIndex: number;
  playerState: PlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  playMode: PlayMode;
  loading: boolean;
  error: string | null;
  isDrawerOpen: boolean;
  uploadErrors: UploadError[];
}

type MusicPlayerAction =
  | { type: "SET_TRACKS"; tracks: MusicTrack[] }
  | { type: "APPEND_TRACKS"; tracks: MusicTrack[] }
  | { type: "SET_CURRENT_INDEX"; index: number }
  | { type: "SET_PLAYER_STATE"; state: PlayerState }
  | { type: "SET_TIME"; time: number }
  | { type: "SET_DURATION"; duration: number }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "SET_PLAY_MODE"; mode: PlayMode }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "TOGGLE_DRAWER" }
  | { type: "REMOVE_TRACK"; id: string }
  | { type: "REORDER"; from: number; to: number }
  | { type: "ADD_UPLOAD_ERROR"; err: UploadError }
  | { type: "CLEAR_UPLOAD_ERRORS" }
  | { type: "CLEAR_PLAYLIST" };

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: MusicPlayerState, action: MusicPlayerAction): MusicPlayerState {
  switch (action.type) {
    case "SET_TRACKS":
      return { ...state, tracks: action.tracks };
    case "APPEND_TRACKS":
      return { ...state, tracks: [...state.tracks, ...action.tracks] };
    case "SET_CURRENT_INDEX":
      return { ...state, currentTrackIndex: action.index };
    case "SET_PLAYER_STATE":
      return { ...state, playerState: action.state };
    case "SET_TIME":
      return { ...state, currentTime: action.time };
    case "SET_DURATION":
      return { ...state, duration: action.duration };
    case "SET_VOLUME":
      return { ...state, volume: action.volume };
    case "SET_PLAY_MODE":
      return { ...state, playMode: action.mode };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "TOGGLE_DRAWER":
      return { ...state, isDrawerOpen: !state.isDrawerOpen };
    case "REMOVE_TRACK": {
      const idx = state.tracks.findIndex((t) => t.id === action.id);
      if (idx === -1) return state;
      const newTracks = state.tracks.filter((t) => t.id !== action.id);
      let newIndex = state.currentTrackIndex;
      if (idx === state.currentTrackIndex) {
        newIndex = -1;
      } else if (idx < state.currentTrackIndex) {
        newIndex = state.currentTrackIndex - 1;
      }
      return { ...state, tracks: newTracks, currentTrackIndex: newIndex };
    }
    case "REORDER": {
      const { from, to } = action;
      if (
        from < 0 || from >= state.tracks.length ||
        to < 0 || to >= state.tracks.length ||
        from === to
      ) return state;
      const copy = [...state.tracks];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      let newIndex = state.currentTrackIndex;
      if (newIndex === from) {
        newIndex = to;
      } else if (newIndex > from && newIndex <= to) {
        newIndex--;
      } else if (newIndex < from && newIndex >= to) {
        newIndex++;
      }
      return { ...state, tracks: copy, currentTrackIndex: newIndex };
    }
    case "ADD_UPLOAD_ERROR":
      return { ...state, uploadErrors: [...state.uploadErrors, action.err] };
    case "CLEAR_UPLOAD_ERRORS":
      return { ...state, uploadErrors: [] };
    case "CLEAR_PLAYLIST":
      return {
        ...state,
        tracks: [],
        currentTrackIndex: -1,
        playerState: "idle",
        currentTime: 0,
        duration: 0,
      };
    default:
      return state;
  }
}

// ── Context value type ────────────────────────────────────────────────────────

type MusicPlayerContextValue = MusicPlayerState & {
  freqRef: React.RefObject<Uint8Array | null>;
  addFiles: (files: File[]) => Promise<void>;
  playTrack: (index: number) => Promise<void>;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  togglePlayMode: () => void;
  removeTrack: (id: string) => Promise<void>;
  clearPlaylist: () => void;
  reorderTracks: (from: number, to: number) => void;
  toggleDrawer: () => void;
  clearError: () => void;
  loadLibrary: () => Promise<void>;
  dismissUploadError: (index: number) => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const prefs = useMemo(() => loadPrefs(), []);

  const [state, dispatch] = useReducer(reducer, {
    tracks: [],
    currentTrackIndex: -1,
    playerState: "idle",
    currentTime: 0,
    duration: 0,
    volume: prefs.volume,
    playMode: prefs.playMode,
    loading: true,
    error: null,
    isDrawerOpen: false,
    uploadErrors: [],
  });

  const freqRef = useRef<Uint8Array>(new Uint8Array(128));
  const engineRef = useRef<PlayerEngine | null>(null);
  const generationRef = useRef(0);
  const nextTrackRef = useRef<() => void>(() => {});
  const freqSyncRef = useRef<() => void>(() => {});

  // Stable refs for callbacks that depend on state
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── PlayerEngine singleton ──
  useEffect(() => {
    const engine = new PlayerEngine();
    engineRef.current = engine;
    return () => { engine.destroy(); engineRef.current = null; };
  }, []);

  // ── Wire engine callbacks ──
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.onTimeUpdate = (time) => dispatch({ type: "SET_TIME", time });
    engine.onLoaded = (dur) => dispatch({ type: "SET_DURATION", duration: dur });
    engine.onEnded = () => nextTrackRef.current();
    engine.onFrequencyData = () => freqSyncRef.current();
  }, []);

  // ── Persist volume / playMode ──
  useEffect(() => {
    savePrefs({ volume: state.volume, playMode: state.playMode });
  }, [state.volume, state.playMode]);

  // ── Helpers ──
  const toMusicTrack = useCallback((s: SavedTrackMeta): MusicTrack => ({
    id: s.id,
    url: `/uploads/music/${s.filename}`,
    title: s.title,
    artist: s.artist,
    album: s.album,
    duration: s.duration,
    coverUrl: s.coverFilename ? `/uploads/music/${s.coverFilename}` : undefined,
    format: s.format,
    lyrics: s.lyrics ?? [],
  }), []);

  // ── loadLibrary ──
  const loadLibrary = useCallback(async () => {
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_ERROR", error: null });
    try {
      const res = await fetch("/api/music/library");
      if (!res.ok) throw new Error(`Failed to load library (${res.status})`);
      const data: SavedTrackMeta[] = await res.json();
      dispatch({ type: "SET_TRACKS", tracks: data.map(toMusicTrack) });
    } catch (e: unknown) {
      dispatch({ type: "SET_ERROR", error: e instanceof Error ? e.message : "Failed to load library" });
    } finally {
      dispatch({ type: "SET_LOADING", loading: false });
    }
  }, [toMusicTrack]);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  // ── addFiles ──
  const addFiles = useCallback(async (files: File[]) => {
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_ERROR", error: null });
    const { parseBlob } = await import("music-metadata-browser");

    const uploadOne = async (file: File): Promise<MusicTrack | null> => {
      try {
        const metadata = await parseBlob(file);
        const { common, format: fmt } = metadata;

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const title = common.title || file.name.replace(/\.[^/.]+$/, "");
        const artist = common.artist || "Unknown Artist";
        const album = common.album || "Unknown Album";
        const ext = file.name.split(".").pop() || "mp3";
        const duration = fmt.duration || 0;

        const lyrics: LyricLine[] = [];
        if (common.lyrics && Array.isArray(common.lyrics)) {
          for (const entry of common.lyrics) {
            if (typeof entry === "string") { lyrics.push({ time: 0, text: entry }); }
            else if (entry && typeof entry === "object") {
              lyrics.push({
                time: (entry as { time?: number }).time ?? 0,
                text: (entry as { text: string }).text ?? String(entry),
              });
            }
          }
        }

        let coverBlob: Blob | null = null;
        if (common.picture && common.picture.length > 0) {
          const pic = common.picture[0];
          coverBlob = new Blob([new Uint8Array(pic.data)], { type: pic.format });
        }

        const formData = new FormData();
        formData.append("audio", file);
        formData.append("metadata", JSON.stringify({ id, title, artist, album, format: ext, duration, lyrics }));
        if (coverBlob) formData.append("cover", coverBlob, "cover.jpg");

        const res = await fetch("/api/music/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error(`Upload failed (${res.status})`);
        const result: { success: boolean; track: SavedTrackMeta } = await res.json();
        return toMusicTrack(result.track);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        dispatch({ type: "ADD_UPLOAD_ERROR", err: { filename: file.name, error: msg } });
        console.error(`Failed to upload ${file.name}:`, e);
        return null;
      }
    };

    const settled = await Promise.allSettled(files.map(uploadOne));
    const newTracks: MusicTrack[] = [];
    for (const r of settled) {
      if (r.status === "fulfilled" && r.value) newTracks.push(r.value);
    }
    if (newTracks.length > 0) dispatch({ type: "APPEND_TRACKS", tracks: newTracks });
    dispatch({ type: "SET_LOADING", loading: false });
  }, [toMusicTrack]);

  // ── playTrack ──
  const playTrack = useCallback(async (index: number) => {
    const engine = engineRef.current;
    const tracks = stateRef.current.tracks;
    const volume = stateRef.current.volume;
    if (!engine || index < 0 || index >= tracks.length) return;
    const track = tracks[index];
    const gen = ++generationRef.current;
    try {
      await engine.load(track.url);
      if (gen !== generationRef.current) return;
      engine.setVolume(volume);
      engine.play();
      dispatch({ type: "SET_CURRENT_INDEX", index });
      dispatch({ type: "SET_PLAYER_STATE", state: "playing" });
      dispatch({ type: "SET_ERROR", error: null });
    } catch (e: unknown) {
      dispatch({ type: "SET_ERROR", error: e instanceof Error ? e.message : "Failed to play track" });
    }
  }, []);

  // ── togglePlay ──
  const togglePlay = useCallback(() => {
    const engine = engineRef.current;
    const { playerState, currentTrackIndex, tracks } = stateRef.current;
    if (!engine) return;
    if (playerState === "playing") { engine.pause(); dispatch({ type: "SET_PLAYER_STATE", state: "paused" }); }
    else if (playerState === "paused") { engine.play(); dispatch({ type: "SET_PLAYER_STATE", state: "playing" }); }
    else if (currentTrackIndex >= 0 && currentTrackIndex < tracks.length) { playTrack(currentTrackIndex); }
  }, [playTrack]);

  // ── nextTrack ──
  const nextTrack = useCallback(() => {
    const { tracks, playMode, currentTrackIndex } = stateRef.current;
    if (tracks.length === 0) return;
    const nextIndex = (() => {
      if (playMode === "shuffle") return Math.floor(Math.random() * tracks.length);
      if (playMode === "single-repeat") return currentTrackIndex >= 0 ? currentTrackIndex : 0;
      return (currentTrackIndex + 1) % tracks.length;
    })();
    playTrack(nextIndex);
  }, [playTrack]);

  nextTrackRef.current = nextTrack;
  freqSyncRef.current = () => {
    const eng = engineRef.current;
    if (eng) freqRef.current.set(eng.freqData);
  };

  // ── prevTrack ──
  const prevTrack = useCallback(() => {
    const { tracks, currentTrackIndex } = stateRef.current;
    if (tracks.length === 0) return;
    const prevIndex = currentTrackIndex <= 0 ? tracks.length - 1 : currentTrackIndex - 1;
    playTrack(prevIndex);
  }, [playTrack]);

  // ── seek / setVolume ──
  const seek = useCallback((time: number) => { engineRef.current?.seek(time); }, []);
  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    dispatch({ type: "SET_VOLUME", volume: clamped });
    engineRef.current?.setVolume(clamped);
  }, []);

  // ── togglePlayMode ──
  const togglePlayMode = useCallback(() => {
    const { playMode } = stateRef.current;
    const next: PlayMode =
      playMode === "sequential" ? "shuffle" :
      playMode === "shuffle" ? "single-repeat" :
      "sequential";
    dispatch({ type: "SET_PLAY_MODE", mode: next });
  }, []);

  // ── removeTrack ──
  const removeTrack = useCallback(async (id: string) => {
    try { await fetch(`/api/music/library?id=${encodeURIComponent(id)}`, { method: "DELETE" }); } catch {}
    const { tracks, currentTrackIndex } = stateRef.current;
    const idx = tracks.findIndex((t) => t.id === id);
    if (idx === currentTrackIndex) {
      engineRef.current?.pause();
      dispatch({ type: "SET_PLAYER_STATE", state: "idle" });
      dispatch({ type: "SET_TIME", time: 0 });
      dispatch({ type: "SET_DURATION", duration: 0 });
    }
    dispatch({ type: "REMOVE_TRACK", id });
  }, []);

  // ── clearPlaylist ──
  const clearPlaylist = useCallback(() => {
    engineRef.current?.pause();
    dispatch({ type: "CLEAR_PLAYLIST" });
  }, []);

  // ── reorderTracks ──
  const reorderTracks = useCallback((from: number, to: number) => {
    dispatch({ type: "REORDER", from, to });
  }, []);

  // ── toggleDrawer / clearError ──
  const toggleDrawer = useCallback(() => { dispatch({ type: "TOGGLE_DRAWER" }); }, []);
  const clearError = useCallback(() => { dispatch({ type: "SET_ERROR", error: null }); }, []);

  // ── dismissUploadError ──
  const dismissUploadError = useCallback((index: number) => {
    dispatch({ type: "CLEAR_UPLOAD_ERRORS" });
    // Re-add all except the dismissed one
    const remaining = stateRef.current.uploadErrors.filter((_, i) => i !== index);
    if (remaining.length > 0) {
      for (const err of remaining) {
        dispatch({ type: "ADD_UPLOAD_ERROR", err });
      }
    }
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          engineRef.current?.seek(
            Math.max(0, (engineRef.current?.currentTime ?? 0) - 5)
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          engineRef.current?.seek(
            Math.min(
              engineRef.current?.duration ?? 0,
              (engineRef.current?.currentTime ?? 0) + 5
            )
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(stateRef.current.volume + 0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(stateRef.current.volume - 0.05);
          break;
        case "n":
        case "N":
        case "MediaTrackNext":
          e.preventDefault();
          nextTrack();
          break;
        case "p":
        case "P":
        case "MediaTrackPrevious":
          e.preventDefault();
          prevTrack();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack, setVolume]);

  // ── Auto-dismiss upload errors after 5s ──
  useEffect(() => {
    if (state.uploadErrors.length === 0) return;
    const timer = setTimeout(() => {
      dispatch({ type: "CLEAR_UPLOAD_ERRORS" });
    }, 5000);
    return () => clearTimeout(timer);
  }, [state.uploadErrors]);

  const value: MusicPlayerContextValue = useMemo(() => ({
    ...state,
    freqRef,
    addFiles,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    togglePlayMode,
    removeTrack,
    clearPlaylist,
    reorderTracks,
    toggleDrawer,
    clearError,
    loadLibrary,
    dismissUploadError,
  }), [state, addFiles, playTrack, togglePlay, nextTrack, prevTrack, seek, setVolume, togglePlayMode, removeTrack, clearPlaylist, reorderTracks, toggleDrawer, clearError, loadLibrary, dismissUploadError]);

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayerContext(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayerContext must be used within MusicPlayerProvider");
  return ctx;
}
