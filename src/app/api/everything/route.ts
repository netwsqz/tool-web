import { NextResponse } from "next/server";
import { searchFiles } from "@/lib/everything/everything-client";
import type { EverythingSearchParams } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const rawCount = parseInt(searchParams.get("count") || "50");
    const count = Math.min(isNaN(rawCount) ? 50 : rawCount, 500);

    const params: EverythingSearchParams = {
      search: searchParams.get("search") || undefined,
      path: searchParams.get("path") || undefined,
      offset: parseInt(searchParams.get("offset") || "0"),
      count,
      sort: (searchParams.get("sort") as EverythingSearchParams["sort"]) || "name",
      ascending: searchParams.get("ascending") !== "0",
    };

    const data = await searchFiles(params);
    // TEMP: verify folder detection works
    if (data.results.length > 0) {
      const sample = data.results.find(r => r.isFolder) || data.results[0];
      console.log("[everything] sample result:", JSON.stringify(sample, null, 2));
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error("Everything search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "搜索失败" },
      { status: 500 }
    );
  }
}
