// animations/hooks.ts — Lightweight hooks for animation.
import { useEffect, type DependencyList } from "react";

export function useGSAP(fn: () => void | (() => void), deps?: DependencyList) {
  useEffect(fn, deps);
}