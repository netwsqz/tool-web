// src/lib/everything/everything-client.ts
//
// Server-only module. Communicates with Everything HTTP Server.
// Never import from client code.

import type {
  EverythingRawResponse,
  EverythingRawResult,
  EverythingFileResult,
  EverythingSearchParams,
  EverythingSearchResponse,
} from "@/types";

/** FILETIME epoch difference: 1601-01-01 to 1970-01-01 in milliseconds */
const FILETIME_EPOCH_DIFF = 11644473600000;

/** Convert Windows FILETIME (100ns units since 1601) to ISO 8601 string */
export function convertFiletime(filetime: number): string {
  // FILETIME is in 100-nanosecond intervals. Convert to milliseconds.
  const ms = filetime / 10000 - FILETIME_EPOCH_DIFF;
  return new Date(ms).toISOString();
}

/** Read Everything HTTP server URL from environment */
export function resolveEverythingUrl(): string {
  const url = process.env.EVERYTHING_HTTP_URL;
  if (!url) {
    throw new Error("EVERYTHING_HTTP_URL 未配置，请在 .env.local 中设置 Everything HTTP 服务器地址");
  }
  return url.replace(/\/+$/, ""); // strip trailing slashes
}

/** Convert a normalized result to the client-facing format */
function normalizeResult(raw: EverythingRawResult): EverythingFileResult {
  const dirPath = raw.path.endsWith("\\") ? raw.path.slice(0, -1) : raw.path;
  const parsedSize = Number(raw.size);
  const safeSize = Number.isFinite(parsedSize) ? Math.max(0, parsedSize) : 0;

  // Detect folder: check type field ("folder"), or attributes bitmask (FILE_ATTRIBUTE_DIRECTORY = 0x10)
  const isFolder =
    raw.type === "folder" ||
    (raw.attributes != null && (raw.attributes & 0x10) !== 0);

  return {
    name: raw.name,
    path: dirPath,
    fullPath: `${dirPath}\\${raw.name}`,
    size: safeSize,
    dateModified: raw.date_modified > 0 ? convertFiletime(raw.date_modified) : "",
    isFolder,
  };
}

/** Build the Everything HTTP query string from search params */
function buildQuery(params: EverythingSearchParams): string {
  const { search, path, offset = 0, count = 50, sort = "name", ascending = true } = params;

  let query = search || "";
  if (path) {
    let cleanPath = path.replace(/\\+$/, "");
    // Drive roots need their trailing backslash (e.g., C: → C:\)
    if (/^[A-Za-z]:$/.test(cleanPath)) {
      cleanPath += "\\";
    }
    const pathFilter = `parent:"${cleanPath}"`;
    query = query ? `${query} ${pathFilter}` : pathFilter;
  }
  if (!query) query = "*";

  const queryParams = new URLSearchParams();
  queryParams.set("search", query);
  queryParams.set("json", "1");
  queryParams.set("path_column", "1");
  queryParams.set("size_column", "1");
  queryParams.set("date_modified_column", "1");
  queryParams.set("offset", String(offset));
  queryParams.set("count", String(count));
  queryParams.set("sort", sort);
  queryParams.set("ascending", ascending ? "1" : "0");

  return queryParams.toString();
}

/** Execute a search against Everything HTTP server and return normalized results */
export async function searchFiles(
  params: EverythingSearchParams
): Promise<EverythingSearchResponse> {
  const baseUrl = resolveEverythingUrl();
  const qs = buildQuery(params);
  const url = `${baseUrl}/?${qs}`;

  const startTime = performance.now();

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new Error("Everything HTTP 请求超时，请检查服务器响应");
    }
    throw new Error("无法连接到 Everything HTTP 服务器，请确认 Everything 已启动且 HTTP 服务器已开启");
  }

  if (!res.ok) {
    throw new Error(`Everything HTTP 返回错误: ${res.status} ${res.statusText}`);
  }

  const data: EverythingRawResponse = await res.json();
  const elapsed = Math.round((performance.now() - startTime)) / 1000;

  return {
    results: (data.results || []).map(normalizeResult),
    totalResults: data.totalResults,
    query: data.query,
    elapsed,
  };
}

/** Browse a directory — convenience wrapper around searchFiles with path constraint */
export async function listDirectory(
  path: string,
  offset = 0,
  count = 50,
  sort: "name" | "size" | "date_modified" = "name",
  ascending = true
): Promise<EverythingSearchResponse> {
  return searchFiles({ path, offset, count, sort, ascending });
}

/** Get available drives by probing common drive letters */
export async function getDrives(): Promise<{ drives: string[] }> {
  // Probe C-Z drives (skip A/B legacy floppy)
  const letters = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const baseUrl = resolveEverythingUrl();

  const results = await Promise.allSettled(
    letters.map(async (letter) => {
      const url = `${baseUrl}/?${new URLSearchParams({
        search: `"${letter}:\\"`,
        json: "1",
        count: "1",
        path_column: "0",
        size_column: "0",
        date_modified_column: "0",
      }).toString()}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (!res.ok) return null;
      const data: EverythingRawResponse = await res.json();
      if (data.totalResults > 0) return `${letter}:\\`;
      return null;
    })
  );

  const drives: string[] = [];
  const failures: unknown[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      drives.push(r.value);
    } else if (r.status === "rejected") {
      failures.push(r.reason);
    }
  }

  // If ALL probes failed, the server is unreachable
  if (failures.length === letters.length) {
    throw new Error("Everything HTTP 服务器无法访问，请确认 Everything 已启动且 HTTP 服务器已开启");
  }

  return { drives };
}

/** Fetch a file from Everything HTTP for download streaming */
export async function fetchFileStream(filepath: string): Promise<Response> {
  const baseUrl = resolveEverythingUrl();
  // Everything HTTP serves files at /path — encode each path segment
  const encoded = filepath
    .replace(/\\/g, "/")
    .split("/")
    .map(seg => encodeURIComponent(seg))
    .join("/");
  const fileUrl = `${baseUrl}/${encoded}`;

  let res: Response;
  try {
    res = await fetch(fileUrl, { signal: AbortSignal.timeout(15000) });
  } catch (e: unknown) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new Error("文件下载超时");
    }
    throw new Error("无法连接到 Everything HTTP 服务器下载文件");
  }

  if (!res.ok) {
    throw new Error(`文件下载失败: ${res.status} ${res.statusText}`);
  }

  return res;
}
