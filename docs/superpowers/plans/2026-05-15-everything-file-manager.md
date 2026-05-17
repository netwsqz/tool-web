# Everything File Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based local file manager using Everything (voidtools) HTTP Server as the backend, with search-first layout, directory browsing, file download, favorites, and directory tree navigation.

**Architecture:** Next.js API routes proxy Everything HTTP Server (`.env.local`-configured), converting FILETIME to ISO 8601. A single `useEverything` hook owns all state. 11 pure UI components render the search-first 3-zone layout.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, Browser fetch + localStorage

---

### Task 1: Type definitions

**Files:**
- Create: `src/types/everything.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write the everything types file**

```typescript
// src/types/everything.ts

/** Raw result from Everything HTTP JSON API */
export interface EverythingRawResult {
  name: string;
  path: string;
  size: number;
  date_modified: number; // Windows FILETIME (100ns intervals since 1601-01-01)
  is_folder: boolean;
}

/** Raw JSON response from Everything HTTP server */
export interface EverythingRawResponse {
  query: string;
  totalResults: number;
  results: EverythingRawResult[];
}

/** Normalized file/folder result for the client */
export interface EverythingFileResult {
  name: string;
  path: string;
  fullPath: string;
  size: number;
  dateModified: string; // ISO 8601
  isFolder: boolean;
}

/** Response from GET /api/everything */
export interface EverythingSearchResponse {
  results: EverythingFileResult[];
  totalResults: number;
  query: string;
  elapsed: number;
}

/** Sort field options */
export type EverythingSortField = "name" | "size" | "date_modified";

/** Parameters for the everything-client search */
export interface EverythingSearchParams {
  search?: string;
  path?: string;
  offset?: number;
  count?: number;
  sort?: EverythingSortField;
  ascending?: boolean;
}
```

- [ ] **Step 2: Re-export from types/index.ts**

Add this line to `src/types/index.ts` after the last export block:

```typescript
export type {
  EverythingRawResult,
  EverythingRawResponse,
  EverythingFileResult,
  EverythingSearchResponse,
  EverythingSortField,
  EverythingSearchParams,
} from "./everything";
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no new errors from these files.

---

### Task 2: Everything HTTP client (server-side)

**Files:**
- Create: `src/lib/everything/everything-client.ts`

- [ ] **Step 1: Write the client module**

```typescript
// src/lib/everything/everything-client.ts
//
// Server-only module. Communicates with Everything HTTP Server.
// Never import from client code.

import type {
  EverythingRawResponse,
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
function normalizeResult(raw: {
  name: string;
  path: string;
  size: number;
  date_modified: number;
  is_folder: boolean;
}): EverythingFileResult {
  const dirPath = raw.path.endsWith("\\") ? raw.path.slice(0, -1) : raw.path;
  return {
    name: raw.name,
    path: dirPath,
    fullPath: `${dirPath}\\${raw.name}`,
    size: raw.size,
    dateModified: raw.date_modified > 0 ? convertFiletime(raw.date_modified) : "",
    isFolder: raw.is_folder,
  };
}

/** Build the Everything HTTP query string from search params */
function buildQuery(params: EverythingSearchParams): string {
  const { search, path, offset = 0, count = 50, sort = "name", ascending = true } = params;

  let query = search || "";
  if (path) {
    const pathFilter = `parent:"${path}"`;
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
  queryParams.set("sort", sort === "date_modified" ? "date_modified" : sort);
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
    res = await fetch(url);
  } catch {
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
  const drives: string[] = [];
  // Check A-Z drives by searching for root-level items
  const letters = "CDEFGHIJKLMNOPQRSTUVWXYZAB".split("");

  const baseUrl = resolveEverythingUrl();

  for (const letter of letters) {
    const url = `${baseUrl}/?${new URLSearchParams({
      search: `"${letter}:\\"`,
      json: "1",
      count: "1",
      path_column: "0",
      size_column: "0",
      date_modified_column: "0",
    }).toString()}`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data: EverythingRawResponse = await res.json();
        if (data.totalResults > 0) {
          drives.push(`${letter}:\\`);
        }
      }
    } catch {
      // Skip unreachable drives
    }
  }

  return { drives };
}

/** Fetch a file from Everything HTTP for download streaming */
export async function fetchFileStream(filepath: string): Promise<Response> {
  const baseUrl = resolveEverythingUrl();
  // Everything HTTP serves files at /path — replace backslashes, encode
  const fileUrl = `${baseUrl}/${filepath.replace(/\\/g, "/").replace(/^([A-Z]):/i, "$1:")}`;

  let res: Response;
  try {
    res = await fetch(fileUrl);
  } catch {
    throw new Error("无法连接到 Everything HTTP 服务器下载文件");
  }

  if (!res.ok) {
    throw new Error(`文件下载失败: ${res.status} ${res.statusText}`);
  }

  return res;
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 3: API routes

**Files:**
- Create: `src/app/api/everything/route.ts`
- Create: `src/app/api/everything/download/route.ts`
- Create: `src/app/api/everything/drives/route.ts`
- Create: `.env.local` (if not exists)

- [ ] **Step 1: Create .env.local**

```
# Everything HTTP Server address
EVERYTHING_HTTP_URL=http://localhost:8080
```

- [ ] **Step 2: Write GET /api/everything (search/browse)**

```typescript
// src/app/api/everything/route.ts
import { NextRequest, NextResponse } from "next/server";
import { searchFiles, type EverythingSearchParams } from "@/lib/everything/everything-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const params: EverythingSearchParams = {
      search: searchParams.get("search") || undefined,
      path: searchParams.get("path") || undefined,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
      count: searchParams.get("count") ? parseInt(searchParams.get("count")!) : 50,
      sort: (searchParams.get("sort") as EverythingSearchParams["sort"]) || "name",
      ascending: searchParams.get("ascending") !== "0",
    };

    if (params.count! > 500) params.count = 500;

    const data = await searchFiles(params);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Everything search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "搜索失败" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Write GET /api/everything/download**

```typescript
// src/app/api/everything/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchFileStream } from "@/lib/everything/everything-client";
import path from "node:path";

export async function GET(request: NextRequest) {
  try {
    const filepath = request.nextUrl.searchParams.get("filepath");
    if (!filepath) {
      return NextResponse.json({ error: "缺少 filepath 参数" }, { status: 400 });
    }

    const upstream = await fetchFileStream(filepath);

    if (!upstream.body) {
      return NextResponse.json({ error: "文件内容为空" }, { status: 500 });
    }

    const filename = path.basename(filepath);

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": upstream.headers.get("content-length") || "",
      },
    });
  } catch (err) {
    console.error("Everything download error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "下载失败" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Write GET /api/everything/drives**

```typescript
// src/app/api/everything/drives/route.ts
import { NextResponse } from "next/server";
import { getDrives } from "@/lib/everything/everything-client";

export async function GET() {
  try {
    const data = await getDrives();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Everything drives error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "获取磁盘列表失败" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 4: useEverything hook

**Files:**
- Create: `src/hooks/useEverything.ts`

- [ ] **Step 1: Write the hook**

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EverythingFileResult, EverythingSearchResponse, EverythingSortField } from "@/types";

interface UseEverythingReturn {
  results: EverythingFileResult[];
  totalResults: number;
  currentPath: string | null;
  searchQuery: string;
  loading: boolean;
  error: string | null;
  elapsed: number;
  sortField: EverythingSortField;
  ascending: boolean;
  offset: number;
  count: number;
  drives: string[];
  drivesLoading: boolean;
  favorites: string[];
  search: (query: string) => void;
  browse: (path: string) => void;
  setSort: (field: EverythingSortField) => void;
  toggleAscending: () => void;
  setPage: (offset: number) => void;
  addFavorite: (path: string) => void;
  removeFavorite: (path: string) => void;
  refresh: () => void;
}

const PAGE_SIZE = 50;

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("everything-favorites");
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("everything-favorites", JSON.stringify(favs));
}

export function useEverything(): UseEverythingReturn {
  const [results, setResults] = useState<EverythingFileResult[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [sortField, setSortField] = useState<EverythingSortField>("name");
  const [ascending, setAscending] = useState(true);
  const [offset, setOffset] = useState(0);
  const [drives, setDrives] = useState<string[]>([]);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failCountRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(
    async (search: string, path: string | null, pageOffset: number, sort: EverythingSortField, asc: boolean) => {
      // Cancel previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (path) params.set("path", path);
      params.set("offset", String(pageOffset));
      params.set("count", String(PAGE_SIZE));
      params.set("sort", sort);
      params.set("ascending", asc ? "1" : "0");

      try {
        const res = await fetch(`/api/everything?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        const data: EverythingSearchResponse = await res.json();
        if (!controller.signal.aborted) {
          setResults(data.results);
          setTotalResults(data.totalResults);
          setElapsed(data.elapsed);
          failCountRef.current = 0;
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        failCountRef.current++;
        if (failCountRef.current >= 3) {
          setError(err instanceof Error ? err.message : "请求失败");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Fetch drives on mount
  useEffect(() => {
    fetch("/api/everything/drives")
      .then((res) => res.json())
      .then((data) => {
        if (data.drives) setDrives(data.drives);
      })
      .catch(() => {
        // Fallback: common drives
        setDrives(["C:\\", "D:\\"]);
      })
      .finally(() => setDrivesLoading(false));
  }, []);

  const search = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setCurrentPath(null);
      setOffset(0);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doFetch(query, null, 0, sortField, ascending);
      }, 300);
    },
    [doFetch, sortField, ascending]
  );

  const browse = useCallback(
    (path: string) => {
      setCurrentPath(path);
      setSearchQuery("");
      setOffset(0);
      doFetch("", path, 0, sortField, ascending);
    },
    [doFetch, sortField, ascending]
  );

  const setSort = useCallback(
    (field: EverythingSortField) => {
      if (field === sortField) {
        // Toggle direction on same field
        const newAsc = !ascending;
        setAscending(newAsc);
        doFetch(searchQuery, currentPath, offset, field, newAsc);
      } else {
        setSortField(field);
        setAscending(true);
        doFetch(searchQuery, currentPath, offset, field, true);
      }
    },
    [doFetch, searchQuery, currentPath, offset, sortField, ascending]
  );

  const toggleAscending = useCallback(() => {
    const newAsc = !ascending;
    setAscending(newAsc);
    doFetch(searchQuery, currentPath, offset, sortField, newAsc);
  }, [doFetch, searchQuery, currentPath, offset, sortField, ascending]);

  const setPage = useCallback(
    (newOffset: number) => {
      setOffset(newOffset);
      doFetch(searchQuery, currentPath, newOffset, sortField, ascending);
    },
    [doFetch, searchQuery, currentPath, sortField, ascending]
  );

  const addFavorite = useCallback((favPath: string) => {
    setFavorites((prev) => {
      if (prev.includes(favPath)) return prev;
      const next = [...prev, favPath];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((favPath: string) => {
    setFavorites((prev) => {
      const next = prev.filter((p) => p !== favPath);
      saveFavorites(next);
      return next;
    });
  }, []);

  const refresh = useCallback(() => {
    doFetch(searchQuery, currentPath, offset, sortField, ascending);
  }, [doFetch, searchQuery, currentPath, offset, sortField, ascending]);

  // Initial load
  useEffect(() => {
    doFetch("", null, 0, sortField, ascending);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    results,
    totalResults,
    currentPath,
    searchQuery,
    loading,
    error,
    elapsed,
    sortField,
    ascending,
    offset,
    count: PAGE_SIZE,
    drives,
    drivesLoading,
    favorites,
    search,
    browse,
    setSort,
    toggleAscending,
    setPage,
    addFavorite,
    removeFavorite,
    refresh,
  };
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 5: UI Components — SearchBar, PathBar, ToolBar, StatusBar

**Files:**
- Create: `src/components/everything-files/SearchBar.tsx`
- Create: `src/components/everything-files/PathBar.tsx`
- Create: `src/components/everything-files/ToolBar.tsx`
- Create: `src/components/everything-files/StatusBar.tsx`

- [ ] **Step 1: Write SearchBar**

```typescript
// src/components/everything-files/SearchBar.tsx
"use client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}

export function SearchBar({ value, onChange, loading }: Props) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索文件... 支持 Everything 语法 (ext: ｜ size: ｜ dm: )"
        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border-card)]
          rounded-2xl px-4 py-3 pl-10 text-sm text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-secondary)]
          focus:outline-none focus:border-[var(--color-accent)] transition-colors"
      />
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
      {loading && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write PathBar**

```typescript
// src/components/everything-files/PathBar.tsx
"use client";

interface Props {
  currentPath: string | null;
  searchQuery: string;
  onNavigate: (path: string) => void;
}

export function PathBar({ currentPath, searchQuery, onNavigate }: Props) {
  if (searchQuery) {
    return (
      <div className="text-sm text-[var(--color-text-secondary)]">
        搜索: &quot;<span className="text-[var(--color-accent)]">{searchQuery}</span>&quot;
      </div>
    );
  }

  if (!currentPath) {
    return <div className="text-sm text-[var(--color-text-secondary)]">全部文件</div>;
  }

  const parts = currentPath.split("\\").filter(Boolean);
  const breadcrumbs: { label: string; path: string }[] = [];
  let accumulated = "";
  for (let i = 0; i < parts.length; i++) {
    accumulated += (i === 0 ? "" : "\\") + parts[i];
    breadcrumbs.push({ label: parts[i], path: accumulated + (i === 0 ? "\\" : "") });
  }

  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap">
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && <span className="text-[var(--color-text-secondary)]">›</span>}
          <button
            onClick={() => onNavigate(crumb.path)}
            className={`hover:text-[var(--color-accent)] transition-colors ${
              i === breadcrumbs.length - 1
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-secondary)]"
            }`}
          >
            {crumb.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: Write ToolBar**

```typescript
// src/components/everything-files/ToolBar.tsx
"use client";

import type { EverythingSortField } from "@/types";

interface Props {
  sortField: EverythingSortField;
  ascending: boolean;
  totalResults: number;
  onSetSort: (field: EverythingSortField) => void;
  onToggleAscending: () => void;
}

const SORT_OPTIONS: { field: EverythingSortField; label: string }[] = [
  { field: "name", label: "名称" },
  { field: "size", label: "大小" },
  { field: "date_modified", label: "修改日期" },
];

export function ToolBar({ sortField, ascending, totalResults, onSetSort, onToggleAscending }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-secondary)]">排序:</span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.field}
            onClick={() => onSetSort(opt.field)}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
              sortField === opt.field
                ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={onToggleAscending}
          className="text-xs px-2 py-1 rounded-lg text-[var(--color-text-secondary)]
            hover:text-[var(--color-text-primary)] transition-colors"
          title={ascending ? "升序" : "降序"}
        >
          {ascending ? "↑ 升序" : "↓ 降序"}
        </button>
      </div>
      <span className="text-xs text-[var(--color-text-secondary)]">
        共 {totalResults.toLocaleString()} 项
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Write StatusBar**

```typescript
// src/components/everything-files/StatusBar.tsx
"use client";

interface Props {
  totalResults: number;
  offset: number;
  count: number;
  elapsed: number;
  onPageChange: (offset: number) => void;
}

export function StatusBar({ totalResults, offset, count, elapsed, onPageChange }: Props) {
  const currentPage = Math.floor(offset / count) + 1;
  const totalPages = Math.max(1, Math.ceil(totalResults / count));

  return (
    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
      <span>
        共 {totalResults.toLocaleString()} 个结果 · 用时 {elapsed.toFixed(2)}s
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            disabled={offset === 0}
            onClick={() => onPageChange(0)}
            className="disabled:opacity-30 hover:text-[var(--color-accent)] transition-colors"
          >
            ««
          </button>
          <button
            disabled={offset === 0}
            onClick={() => onPageChange(Math.max(0, offset - count))}
            className="disabled:opacity-30 hover:text-[var(--color-accent)] transition-colors"
          >
            «
          </button>
          <span>
            第 {currentPage}/{totalPages} 页
          </span>
          <button
            disabled={offset + count >= totalResults}
            onClick={() => onPageChange(offset + count)}
            className="disabled:opacity-30 hover:text-[var(--color-accent)] transition-colors"
          >
            »
          </button>
          <button
            disabled={offset + count >= totalResults}
            onClick={() => onPageChange(Math.floor(totalResults / count) * count)}
            className="disabled:opacity-30 hover:text-[var(--color-accent)] transition-colors"
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 6: UI Components — FileRow, FileList

**Files:**
- Create: `src/components/everything-files/FileRow.tsx`
- Create: `src/components/everything-files/FileList.tsx`

- [ ] **Step 1: Write FileRow**

```typescript
// src/components/everything-files/FileRow.tsx
"use client";

import type { EverythingFileResult } from "@/types";

function formatSize(bytes: number): string {
  if (bytes === 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  file: EverythingFileResult;
  onClick: () => void;
}

export function FileRow({ file, onClick }: Props) {
  const downloadUrl = `/api/everything/download?filepath=${encodeURIComponent(file.fullPath)}`;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group ${
        file.isFolder
          ? "cursor-pointer hover:bg-[var(--color-bg-card)]"
          : "hover:bg-[var(--color-bg-card)]/50"
      }`}
      onClick={file.isFolder ? onClick : undefined}
      onDoubleClick={!file.isFolder ? onClick : undefined}
    >
      {/* Icon */}
      <span className="text-lg flex-shrink-0 w-7 text-center">
        {file.isFolder ? "📁" : "📄"}
      </span>

      {/* Name */}
      <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">
        {file.name}
      </span>

      {/* Size */}
      <span className="text-xs text-[var(--color-text-secondary)] w-20 text-right flex-shrink-0">
        {file.isFolder ? "-" : formatSize(file.size)}
      </span>

      {/* Date */}
      <span className="text-xs text-[var(--color-text-secondary)] w-36 text-right flex-shrink-0 hidden sm:block">
        {formatDate(file.dateModified)}
      </span>

      {/* Download button (files only) */}
      {!file.isFolder && (
        <a
          href={downloadUrl}
          download={file.name}
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity
            text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
            px-2 py-1 flex-shrink-0"
          title="下载"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write FileList**

```typescript
// src/components/everything-files/FileList.tsx
"use client";

import type { EverythingFileResult, EverythingSortField } from "@/types";
import { FileRow } from "./FileRow";

interface Props {
  results: EverythingFileResult[];
  loading: boolean;
  error: string | null;
  sortField: EverythingSortField;
  ascending: boolean;
  onOpenFolder: (path: string) => void;
  onRefresh: () => void;
}

export function FileList({ results, loading, error, sortField, ascending, onOpenFolder, onRefresh }: Props) {
  // Empty state
  if (!loading && !error && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-secondary)]">
        <span className="text-4xl mb-4">📂</span>
        <p className="text-sm">无结果</p>
        <p className="text-xs mt-1">尝试其他搜索词或检查 Everything 是否正常运行</p>
      </div>
    );
  }

  // Error state
  if (error && results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-400">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-sm">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-3 text-xs text-[var(--color-accent)] hover:underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 text-xs text-[var(--color-text-secondary)] border-b border-[var(--color-border-card)]">
        <span className="w-7 flex-shrink-0" />
        <span className="flex-1">名称</span>
        <span className="w-20 text-right flex-shrink-0">大小</span>
        <span className="w-36 text-right flex-shrink-0 hidden sm:block">修改日期</span>
        <span className="w-8 flex-shrink-0" />
      </div>

      {/* Rows */}
      <div className="min-h-[200px]">
        {results.map((file, i) => (
          <FileRow
            key={`${file.fullPath}-${i}`}
            file={file}
            onClick={() => onOpenFolder(file.fullPath)}
          />
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[var(--color-bg-primary)]/50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 7: UI Components — Sidebar, DriveList, Favorites, DirectoryTree

**Files:**
- Create: `src/components/everything-files/Sidebar.tsx`
- Create: `src/components/everything-files/DriveList.tsx`
- Create: `src/components/everything-files/Favorites.tsx`
- Create: `src/components/everything-files/DirectoryTree.tsx`

- [ ] **Step 1: Write DriveList**

```typescript
// src/components/everything-files/DriveList.tsx
"use client";

interface Props {
  drives: string[];
  loading: boolean;
  onBrowse: (path: string) => void;
}

export function DriveList({ drives, loading, onBrowse }: Props) {
  return (
    <div>
      <h3 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 px-1">磁盘</h3>
      {loading ? (
        <div className="px-1 text-xs text-[var(--color-text-secondary)]">检测中...</div>
      ) : (
        <div className="space-y-0.5">
          {drives.map((drive) => (
            <button
              key={drive}
              onClick={() => onBrowse(drive)}
              className="w-full text-left px-2 py-1.5 rounded-lg text-sm
                text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                hover:bg-[var(--color-bg-card)] transition-colors"
            >
              💾 {drive}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write Favorites**

```typescript
// src/components/everything-files/Favorites.tsx
"use client";

import { useState } from "react";

interface Props {
  favorites: string[];
  currentPath: string | null;
  onBrowse: (path: string) => void;
  onAdd: (path: string) => void;
  onRemove: (path: string) => void;
}

export function Favorites({ favorites, currentPath, onBrowse, onAdd, onRemove }: Props) {
  const [adding, setAdding] = useState(false);

  const handleAddCurrent = () => {
    if (currentPath) {
      onAdd(currentPath);
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-medium text-[var(--color-text-secondary)]">收藏夹</h3>
        <div className="flex items-center gap-1">
          {currentPath && (
            <button
              onClick={() => setAdding(!adding)}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
                transition-colors"
              title="添加当前目录到收藏夹"
            >
              {adding ? "取消" : "+"}
            </button>
          )}
        </div>
      </div>

      {adding && (
        <div className="mb-2 px-1">
          <button
            onClick={handleAddCurrent}
            className="text-xs text-[var(--color-accent)] hover:underline truncate block w-full text-left"
          >
            + 收藏当前目录: {currentPath}
          </button>
        </div>
      )}

      {favorites.length === 0 ? (
        <p className="px-1 text-xs text-[var(--color-text-secondary)] opacity-50">
          暂无收藏，浏览目录时可点击 + 添加
        </p>
      ) : (
        <div className="space-y-0.5">
          {favorites.map((fav) => (
            <div key={fav} className="flex items-center group px-1 rounded-lg hover:bg-[var(--color-bg-card)]">
              <button
                onClick={() => onBrowse(fav)}
                className="flex-1 text-left py-1.5 text-sm text-[var(--color-text-secondary)]
                  hover:text-[var(--color-text-primary)] transition-colors truncate"
              >
                ⭐ {fav.split("\\").pop() || fav}
                <span className="block text-xs opacity-50 truncate">{fav}</span>
              </button>
              <button
                onClick={() => onRemove(fav)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-400
                  hover:text-red-300 px-1 transition-opacity"
                title="移除收藏"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write DirectoryTree**

```typescript
// src/components/everything-files/DirectoryTree.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  loaded: boolean;
  expanded: boolean;
}

interface Props {
  onBrowse: (path: string) => void;
}

function buildRootNode(drive: string): TreeNode {
  return {
    name: drive,
    path: drive,
    children: [],
    loaded: false,
    expanded: false,
  };
}

export function DirectoryTree({ onBrowse }: Props) {
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Load drives on mount
  useEffect(() => {
    fetch("/api/everything/drives")
      .then((res) => res.json())
      .then((data) => {
        const drives: string[] = data.drives || ["C:\\", "D:\\"];
        setRoots(drives.map(buildRootNode));
      })
      .catch(() => setRoots(["C:\\", "D:\\"].map(buildRootNode)))
      .finally(() => setLoading(false));
  }, []);

  const loadChildren = useCallback(async (node: TreeNode) => {
    const params = new URLSearchParams();
    params.set("path", node.path);
    params.set("count", "200");
    params.set("sort", "name");

    const res = await fetch(`/api/everything?${params.toString()}`);
    const data = await res.json();

    const folders = (data.results || [])
      .filter((f: { isFolder: boolean }) => f.isFolder)
      .map((f: { name: string; fullPath: string }) => ({
        name: f.name,
        path: f.fullPath,
        children: [],
        loaded: false,
        expanded: false,
      }));

    return folders;
  }, []);

  const toggleExpand = useCallback(
    async (node: TreeNode, setNodes: React.Dispatch<React.SetStateAction<TreeNode[]>>) => {
      if (node.expanded) {
        node.expanded = false;
      } else {
        node.expanded = true;
        if (!node.loaded) {
          node.children = await loadChildren(node);
          node.loaded = true;
        }
      }
      setNodes((prev) => [...prev]);
    },
    [loadChildren]
  );

  const renderNode = (
    node: TreeNode,
    depth: number,
    setNodes: React.Dispatch<React.SetStateAction<TreeNode[]>>
  ) => {
    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-1 px-1 py-1 rounded text-sm cursor-pointer
            hover:bg-[var(--color-bg-card)] transition-colors group"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          <button
            onClick={() => toggleExpand(node, setNodes)}
            className="w-4 h-4 flex items-center justify-center text-xs
              text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {node.children.length > 0 || !node.loaded
              ? (node.expanded ? "▾" : "▸")
              : ""}
          </button>
          <span
            className="flex-1 truncate text-[var(--color-text-secondary)]
              hover:text-[var(--color-text-primary)]"
            onClick={() => onBrowse(node.path)}
          >
            📁 {node.name}
          </span>
        </div>
        {node.expanded &&
          node.children.map((child) => renderNode(child, depth + 1, setNodes))}
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 px-1">目录树</h3>
        <div className="px-1 text-xs text-[var(--color-text-secondary)]">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 px-1">目录树</h3>
      <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
        {roots.map((root) => renderNode(root, 0, setRoots))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write Sidebar**

```typescript
// src/components/everything-files/Sidebar.tsx
"use client";

import { DriveList } from "./DriveList";
import { Favorites } from "./Favorites";
import { DirectoryTree } from "./DirectoryTree";

interface Props {
  drives: string[];
  drivesLoading: boolean;
  favorites: string[];
  currentPath: string | null;
  onBrowse: (path: string) => void;
  onAddFavorite: (path: string) => void;
  onRemoveFavorite: (path: string) => void;
}

export function Sidebar({
  drives,
  drivesLoading,
  favorites,
  currentPath,
  onBrowse,
  onAddFavorite,
  onRemoveFavorite,
}: Props) {
  return (
    <aside className="w-56 flex-shrink-0 space-y-6 overflow-y-auto">
      <DriveList drives={drives} loading={drivesLoading} onBrowse={onBrowse} />
      <Favorites
        favorites={favorites}
        currentPath={currentPath}
        onBrowse={onBrowse}
        onAdd={onAddFavorite}
        onRemove={onRemoveFavorite}
      />
      <DirectoryTree onBrowse={onBrowse} />
    </aside>
  );
}
```

- [ ] **Step 5: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 8: Page assembly + Tool registry

**Files:**
- Create: `src/app/tools/everything-files/page.tsx`
- Modify: `src/lib/tools.ts`

- [ ] **Step 1: Write the page**

```typescript
// src/app/tools/everything-files/page.tsx
"use client";

import Link from "next/link";
import { useEverything } from "@/hooks/useEverything";
import { SearchBar } from "@/components/everything-files/SearchBar";
import { Sidebar } from "@/components/everything-files/Sidebar";
import { PathBar } from "@/components/everything-files/PathBar";
import { ToolBar } from "@/components/everything-files/ToolBar";
import { FileList } from "@/components/everything-files/FileList";
import { StatusBar } from "@/components/everything-files/StatusBar";

export default function EverythingFilesPage() {
  const {
    results,
    totalResults,
    currentPath,
    searchQuery,
    loading,
    error,
    elapsed,
    sortField,
    ascending,
    offset,
    count,
    drives,
    drivesLoading,
    favorites,
    search,
    browse,
    setSort,
    toggleAscending,
    setPage,
    addFavorite,
    removeFavorite,
  } = useEverything();

  const handleBrowse = (folderPath: string) => {
    if (currentPath && folderPath.endsWith("..")) {
      // Go up one level
      const parts = currentPath.split("\\").filter(Boolean);
      parts.pop();
      browse(parts.join("\\") + (parts.length === 1 ? "\\" : ""));
    } else {
      browse(folderPath);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-8 h-screen flex flex-col">
      {/* Header */}
      <header className="mb-4 flex-shrink-0">
        <Link
          href="/"
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]
            transition-colors"
        >
          ← 返回首页
        </Link>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mt-2">
          文件管理
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Everything 引擎 · 本地文件搜索与浏览
        </p>
      </header>

      {/* Search */}
      <div className="mb-4 flex-shrink-0">
        <SearchBar value={searchQuery} onChange={search} loading={loading} />
      </div>

      {/* Main content */}
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar
          drives={drives}
          drivesLoading={drivesLoading}
          favorites={favorites}
          currentPath={currentPath}
          onBrowse={handleBrowse}
          onAddFavorite={addFavorite}
          onRemoveFavorite={removeFavorite}
        />

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Navigation + Toolbar */}
          <div className="flex-shrink-0 space-y-2 mb-2">
            <div className="flex items-center gap-2">
              {currentPath && (
                <button
                  onClick={() => {
                    const parts = currentPath.split("\\").filter(Boolean);
                    if (parts.length === 1) {
                      // At drive root — go to "all files"
                      browse(parts[0] + "\\");
                      return;
                    }
                    parts.pop();
                    const upPath = parts.join("\\") + (parts.length === 1 ? "\\" : "");
                    browse(upPath);
                  }}
                  className="text-xs px-2 py-1 rounded-lg text-[var(--color-text-secondary)]
                    hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]
                    transition-colors"
                >
                  ↑ 上级目录
                </button>
              )}
              <PathBar
                currentPath={currentPath}
                searchQuery={searchQuery}
                onNavigate={handleBrowse}
              />
            </div>
            <ToolBar
              sortField={sortField}
              ascending={ascending}
              totalResults={totalResults}
              onSetSort={setSort}
              onToggleAscending={toggleAscending}
            />
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto min-h-0 glass rounded-2xl p-3">
            <FileList
              results={results}
              loading={loading}
              error={error}
              sortField={sortField}
              ascending={ascending}
              onOpenFolder={handleBrowse}
              onRefresh={() => {
                if (searchQuery) search(searchQuery);
                else if (currentPath) browse(currentPath);
              }}
            />
          </div>

          {/* Status bar */}
          <div className="flex-shrink-0 mt-2">
            <StatusBar
              totalResults={totalResults}
              offset={offset}
              count={count}
              elapsed={elapsed}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Register tool in registry**

Add this entry to `src/lib/tools.ts` (insert in the tools array before the closing `];`):

```typescript
  {
    id: "everything-files",
    name: "文件管理",
    description: "本地文件搜索浏览 · Everything 引擎",
    icon: "🗂️",
    path: "/tools/everything-files",
    status: "active",
  },
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

---

### Task 9: Verification

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 2: Start dev server**

Run: `npm run dev`
Expected: dev server starts, navigate to http://localhost:3000/tools/everything-files

- [ ] **Step 3: Verify tool appears on homepage**

Open http://localhost:3000 — verify "文件管理" card exists in the tool grid, clicking navigates to `/tools/everything-files`.

- [ ] **Step 4: Verify error state without Everything**

With Everything HTTP server OFF: page should show error "无法连接到 Everything HTTP 服务器".

- [ ] **Step 5: Verify with Everything HTTP server ON**

Enable Everything HTTP server (Tools → Options → HTTP Server), then:
- Search: type a query, verify results appear after debounce
- Browse: click a folder, verify list updates + breadcrumb changes
- Sort: toggle sort by name/size/date, verify reordering
- Download: click download icon on a file, verify download starts
- Favorites: click + to add current dir to favorites, verify it persists on refresh
- Directory tree: expand a drive node, verify folders load lazily
- Pagination: use page controls at bottom if >50 results
