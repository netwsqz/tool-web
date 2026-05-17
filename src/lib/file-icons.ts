// Extension → icon mapping for file browser

const EXTENSION_ICONS: Record<string, string> = {
  // Images
  jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", webp: "🖼️", svg: "🖼️",
  bmp: "🖼️", ico: "🖼️", raw: "🖼️", heic: "🖼️", avif: "🖼️",
  // Videos
  mp4: "🎬", avi: "🎬", mkv: "🎬", mov: "🎬", wmv: "🎬", flv: "🎬",
  webm: "🎬", m4v: "🎬",
  // Audio
  mp3: "🎵", wav: "🎵", flac: "🎵", ogg: "🎵", aac: "🎵", wma: "🎵",
  m4a: "🎵", ape: "🎵", opus: "🎵",
  // Archives
  zip: "📦", rar: "📦", "7z": "📦", tar: "📦", gz: "📦", bz2: "📦",
  xz: "📦", zst: "📦",
  // Code / dev
  ts: "🔷", tsx: "🔷", js: "🟨", jsx: "🟨", mjs: "🟨", cjs: "🟨",
  py: "🐍", rs: "🦀", go: "🔵", java: "☕", kt: "☕",
  json: "📋", xml: "📋", yaml: "📋", yml: "📋", toml: "📋",
  html: "🌐", htm: "🌐", css: "🎨", scss: "🎨", less: "🎨",
  sql: "🗃️", sh: "💻", bash: "💻", ps1: "💻", fish: "💻",
  // Documents
  pdf: "📕", epub: "📕",
  doc: "📘", docx: "📘", xls: "📗", xlsx: "📗", ppt: "📙", pptx: "📙",
  // Text
  txt: "📝", md: "📝", log: "📝", rtf: "📝",
  // Executables / system
  exe: "⚙️", msi: "⚙️", bat: "⚙️", cmd: "⚙️", dll: "🔧",
  // Disk / misc
  iso: "💿", torrent: "🧲", nfo: "ℹ️", ini: "🔧", cfg: "🔧", conf: "🔧",
};

const DEFAULT_ICON = "📄";

export function getFileIcon(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return DEFAULT_ICON;
  return EXTENSION_ICONS[fileName.slice(dot + 1).toLowerCase()] ?? DEFAULT_ICON;
}
