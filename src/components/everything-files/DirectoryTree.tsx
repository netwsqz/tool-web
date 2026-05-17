"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EverythingFileResult } from "@/types";
import { FolderIcon, FolderOpenIcon } from "./FileIcon";

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

const LOADING_PATHS = new Set<string>();

export function DirectoryTree({ onBrowse }: Props) {
  const [roots, setRoots] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/everything/drives")
      .then((res) => res.json())
      .then((data) => {
        const drives: string[] = data.drives || ["C:\\", "D:\\"];
        setRoots(
          drives.map((drive) => ({
            name: drive,
            path: drive,
            children: [],
            loaded: false,
            expanded: false,
          }))
        );
      })
      .catch(() =>
        setRoots(
          ["C:\\", "D:\\"].map((drive) => ({
            name: drive,
            path: drive,
            children: [],
            loaded: false,
            expanded: false,
          }))
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback(
    async (nodePath: string) => {
      // Check if already loading this path
      if (LOADING_PATHS.has(nodePath)) return;

      // Do a sync toggle first — check if node is loaded
      let needsLoad = false;
      setRoots((prev) => {
        const update = (nodes: TreeNode[]): TreeNode[] =>
          nodes.map((n) => {
            if (n.path === nodePath) {
              needsLoad = !n.loaded;
              return { ...n, expanded: !n.expanded };
            }
            if (n.children.length > 0) return { ...n, children: update(n.children) };
            return n;
          });
        return update(prev);
      });

      if (!needsLoad) return;

      // Load children asynchronously
      LOADING_PATHS.add(nodePath);
      try {
        const params = new URLSearchParams();
        params.set("path", nodePath);
        params.set("count", "200");
        params.set("sort", "name");

        const res = await fetch(`/api/everything?${params.toString()}`);
        const data = await res.json();

        const children: TreeNode[] = (data.results || [])
          .filter((f: { isFolder: boolean }) => f.isFolder)
          .map((f: { name: string; fullPath: string }) => ({
            name: f.name,
            path: f.fullPath,
            children: [],
            loaded: false,
            expanded: false,
          }));

        setRoots((prev) => {
          const update = (nodes: TreeNode[]): TreeNode[] =>
            nodes.map((n) => {
              if (n.path === nodePath) return { ...n, children, loaded: true };
              if (n.children.length > 0) return { ...n, children: update(n.children) };
              return n;
            });
          return update(prev);
        });
      } catch {
        // On error, unexpand the node
        setRoots((prev) => {
          const update = (nodes: TreeNode[]): TreeNode[] =>
            nodes.map((n) => {
              if (n.path === nodePath) return { ...n, expanded: false, loaded: true };
              if (n.children.length > 0) return { ...n, children: update(n.children) };
              return n;
            });
          return update(prev);
        });
      } finally {
        LOADING_PATHS.delete(nodePath);
      }
    },
    [] // no deps needed — uses functional state updates
  );

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const hasChildren = node.children.length > 0 || !node.loaded;
    return (
      <div key={node.path}>
        <div
          className="flex items-center gap-1 px-1 py-1 rounded text-sm cursor-pointer
            hover:bg-[var(--color-bg-card)] transition-colors group"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(node.path);
            }}
            className="w-4 h-4 flex items-center justify-center text-xs
              text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {hasChildren ? (node.expanded ? "▾" : "▸") : ""}
          </button>
          <span
            className="flex-1 truncate text-[var(--color-text-secondary)]
              hover:text-[var(--color-text-primary)] flex items-center gap-1"
            onClick={() => onBrowse(node.path)}
          >
            {node.expanded ? (
              <FolderOpenIcon className="w-4 h-4 flex-shrink-0 text-yellow-500" />
            ) : (
              <FolderIcon className="w-4 h-4 flex-shrink-0 text-yellow-500" />
            )}
            {node.name}
          </span>
        </div>
        {node.expanded &&
          node.children.map((child) => renderNode(child, depth + 1))}
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
        {roots.map((root) => renderNode(root, 0))}
      </div>
    </div>
  );
}
