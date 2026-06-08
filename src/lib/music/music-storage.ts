import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MUSIC_DIR = path.join(process.cwd(), "public", "uploads", "music");
const LIBRARY_FILE = path.join(MUSIC_DIR, "library.json");

export type SavedLyricLine = {
  time: number;
  text: string;
  translation?: string;
};

export type SavedTrackMeta = {
  id: string;
  title: string;
  artist: string;
  album: string;
  format: string;
  duration: number;
  filename: string;
  coverFilename?: string;
  lyrics: SavedLyricLine[];
};

async function ensureDir() {
  if (!existsSync(MUSIC_DIR)) {
    await fs.mkdir(MUSIC_DIR, { recursive: true });
  }
}

async function readLibrary(): Promise<SavedTrackMeta[]> {
  await ensureDir();
  if (!existsSync(LIBRARY_FILE)) return [];
  try {
    const data = await fs.readFile(LIBRARY_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeLibrary(lib: SavedTrackMeta[]) {
  await ensureDir();
  await fs.writeFile(LIBRARY_FILE, JSON.stringify(lib, null, 2), "utf-8");
}

export async function getLibrary(): Promise<SavedTrackMeta[]> {
  return readLibrary();
}

export async function saveTrack(
  id: string,
  audioBuffer: Buffer,
  coverBuffer: Buffer | null,
  meta: { title: string; artist: string; album: string; format: string; duration: number },
  lyrics: SavedLyricLine[] = [],
): Promise<SavedTrackMeta> {
  await ensureDir();

  // 安全检查：防止路径穿越 — id 和 format 必须不包含路径分隔符
  const safeId = id.replace(/[/\\:*?"<>|]/g, "_");
  const safeFormat = meta.format.replace(/[/\\:*?"<>|]/g, "_");
  const audioFilename = `${safeId}.${safeFormat}`;

  // 安全检查：确保文件名不包含路径分隔符
  if (audioFilename.includes("/") || audioFilename.includes("\\") || audioFilename.includes("..")) {
    throw new Error("文件名包含非法字符");
  }
  await fs.writeFile(path.join(MUSIC_DIR, audioFilename), audioBuffer);

  let coverFilename: string | undefined;
  if (coverBuffer) {
    coverFilename = `${safeId}_cover.jpg`;
    await fs.writeFile(path.join(MUSIC_DIR, coverFilename), coverBuffer);
  }

  const entry: SavedTrackMeta = {
    id,
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    format: meta.format,
    duration: meta.duration,
    filename: audioFilename,
    coverFilename,
    lyrics,
  };

  const lib = await readLibrary();
  // Replace if ID already exists (re-upload)
  const existingIdx = lib.findIndex((e) => e.id === id);
  if (existingIdx >= 0) {
    lib[existingIdx] = entry;
  } else {
    lib.push(entry);
  }
  await writeLibrary(lib);

  return entry;
}

export async function deleteTrack(id: string): Promise<boolean> {
  const lib = await readLibrary();
  const idx = lib.findIndex((e) => e.id === id);
  if (idx === -1) return false;

  const entry = lib[idx];
  // Remove audio file
  const audioPath = path.join(MUSIC_DIR, entry.filename);
  if (existsSync(audioPath)) await fs.unlink(audioPath);
  // Remove cover file
  if (entry.coverFilename) {
    const coverPath = path.join(MUSIC_DIR, entry.coverFilename);
    if (existsSync(coverPath)) await fs.unlink(coverPath);
  }

  lib.splice(idx, 1);
  await writeLibrary(lib);
  return true;
}
