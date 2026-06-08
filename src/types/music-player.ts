export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

export interface MusicTrack {
  id: string;
  file?: File;
  url: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl?: string;
  format: string;
  lyrics: LyricLine[];
}

export type PlayMode = "sequential" | "shuffle" | "single-repeat";
export type PlayerState = "idle" | "playing" | "paused";
