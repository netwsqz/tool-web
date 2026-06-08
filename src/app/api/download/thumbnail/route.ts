import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url");
  if (!imageUrl) {
    return NextResponse.json({ error: "缺少 url 参数" }, { status: 400 });
  }

  // SSRF 防护：仅允许 HTTPS URL，阻止内网地址
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      { headers: { "Content-Type": "image/gif" } }
    );
  }

  if (parsed.protocol !== "https:") {
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      { headers: { "Content-Type": "image/gif" } }
    );
  }

  // 阻止内网地址
  const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168."];
  const hostname = parsed.hostname.toLowerCase();
  if (blockedHosts.some((h) => hostname === h || hostname.startsWith(h))) {
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      { headers: { "Content-Type": "image/gif" } }
    );
  }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Referer: "https://www.bilibili.com/",
      },
    });

    if (!res.ok) {
      // Return a 1x1 transparent pixel as fallback
      return new NextResponse(
        Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        ),
        {
          headers: { "Content-Type": "image/gif" },
        }
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(
      Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
      {
        headers: { "Content-Type": "image/gif" },
      }
    );
  }
}
