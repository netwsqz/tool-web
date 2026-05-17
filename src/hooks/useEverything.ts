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
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage after hydration (SSR-safe)
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failCountRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const sortFieldRef = useRef<EverythingSortField>(sortField);
  const ascendingRef = useRef(ascending);

  useEffect(() => {
    sortFieldRef.current = sortField;
    ascendingRef.current = ascending;
  }, [sortField, ascending]);

  // Clear pending debounce if sort changes mid-typing — prevents stale sort in-flight
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, [sortField, ascending]);

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
        doFetch(query, null, 0, sortFieldRef.current, ascendingRef.current);
      }, 300);
    },
    [doFetch]
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
