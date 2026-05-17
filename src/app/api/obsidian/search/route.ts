import { NextRequest, NextResponse } from "next/server";
import { searchFiles } from "@/lib/obsidian-storage";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || !q.trim()) {
    return NextResponse.json([]);
  }

  const results = searchFiles(q.trim());
  return NextResponse.json(results);
}
