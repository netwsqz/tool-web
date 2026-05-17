import fs from "fs";
import path from "path";

const CHAT_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "chat");

function ensureDir() {
  if (!fs.existsSync(CHAT_UPLOAD_DIR)) {
    fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true });
  }
}

export function saveChatFile(buffer: Buffer, filename: string): string {
  ensureDir();
  const safeName = filename.replace(/[^a-zA-Z0-9._\-一-鿿]/g, "_");
  const filePath = path.join(CHAT_UPLOAD_DIR, safeName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/chat/${safeName}`;
}
