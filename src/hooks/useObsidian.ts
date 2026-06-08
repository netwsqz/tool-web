"use client";

import { useCallback, useEffect, useState } from "react";
import type { ObsidianFile, ObsidianSearchResult } from "@/types";

export function useObsidian() {
  const [files, setFiles] = useState<ObsidianFile[]>([]);
  const [activeFilePath, setActiveFilePathState] = useState<string | null>(
    null
  );
  const [content, setContentState] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ObsidianSearchResult[]>(
    []
  );
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  // 防止快速切换文件时的竞态条件
  const loadGenerationRef = { current: 0 };

  const isDirty = content !== originalContent && activeFilePath !== null;
  const activeFile = files.find((f) => f.path === activeFilePath) ?? null;

  // --- File listing ---

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/obsidian/files");
      if (!res.ok) throw new Error("请求失败");
      setFiles(await res.json());
    } catch {
      setError("无法加载文件列表");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Load single file ---

  const loadFile = useCallback(async (path: string) => {
    const gen = ++loadGenerationRef.current;
    setIsLoadingContent(true);
    setError(null);
    try {
      const res = await fetch(`/api/obsidian/files?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("读取失败");
      const data = await res.json();
      // 只有当前 generation 最新时才更新状态，防止竞态
      if (loadGenerationRef.current === gen) {
        setContentState(data.content);
        setOriginalContent(data.content);
      }
    } catch {
      if (loadGenerationRef.current === gen) {
        setError("无法读取文件");
        setContentState("");
        setOriginalContent("");
      }
    } finally {
      if (loadGenerationRef.current === gen) {
        setIsLoadingContent(false);
      }
    }
  }, []);

  // --- Save ---

  const saveFile = useCallback(async () => {
    if (!activeFilePath || !isDirty) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/obsidian/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: activeFilePath, content }),
      });
      if (!res.ok) throw new Error("保存失败");
      setOriginalContent(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }, [activeFilePath, content, isDirty]);

  // --- Create ---

  const createFile = useCallback(
    async (name: string) => {
      setError(null);
      try {
        const res = await fetch("/api/obsidian/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "创建失败");
        }
        const file: ObsidianFile = await res.json();
        await fetchFiles();
        setActiveFilePathState(file.path);
        loadFile(file.path);
      } catch (e) {
        setError(e instanceof Error ? e.message : "创建失败");
      }
    },
    [fetchFiles, loadFile]
  );

  // --- Delete ---

  const deleteFile = useCallback(
    async (path: string) => {
      setError(null);
      try {
        const res = await fetch(`/api/obsidian/files?path=${encodeURIComponent(path)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("删除失败");
        if (activeFilePath === path) {
          setActiveFilePathState(null);
          setContentState("");
          setOriginalContent("");
        }
        await fetchFiles();
      } catch (e) {
        setError(e instanceof Error ? e.message : "删除失败");
      }
    },
    [activeFilePath, fetchFiles]
  );

  // --- Search ---

  const search = useCallback(async (q: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/obsidian/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("搜索失败");
      setSearchResults(await res.json());
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // --- Setters ---

  const setContent = useCallback((val: string) => {
    setContentState(val);
  }, []);

  const setActiveFilePath = useCallback(
    (path: string | null) => {
      setActiveFilePathState(path);
      if (path) loadFile(path);
    },
    [loadFile]
  );

  // --- Effects ---

  // Initial load
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Auto-save debounce (2s after last edit)
  useEffect(() => {
    if (!isDirty || !activeFilePath) return;
    const timer = setTimeout(() => {
      saveFile();
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, isDirty, activeFilePath, saveFile]);

  // Ctrl+S immediate save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isDirty && activeFilePath) saveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, activeFilePath, saveFile]);

  // Search debounce (300ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      search(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  return {
    files,
    activeFilePath,
    content,
    originalContent,
    isLoading,
    isLoadingContent,
    isSaving,
    error,
    searchQuery,
    searchResults,
    isSearching,
    sidebarCollapsed,
    previewCollapsed,
    isDirty,
    activeFile,
    fetchFiles,
    loadFile,
    saveFile,
    createFile,
    deleteFile,
    setContent,
    setActiveFilePath,
    setSearchQuery,
    setSidebarCollapsed,
    setPreviewCollapsed,
    setError,
  };
}
