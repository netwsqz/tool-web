import { NextResponse } from "next/server";
import { detectAvailableBrowsers } from "@/lib/download/ytdlp";

export async function GET() {
  const browsers = detectAvailableBrowsers();
  return NextResponse.json({ browsers });
}
