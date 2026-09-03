import { api } from "./api.js";
import { localStore } from "./localStore.js";

let resolved = null;

/**
 * Resolve which data store to use, once per session:
 * - the backend API when a healthy server responds (full-stack dev), or
 * - localStorage when there is no backend (e.g. static GitHub Pages hosting).
 */
export async function getStore() {
  if (resolved) return resolved;
  try {
    const res = await fetch("/api/health", { signal: AbortSignal.timeout(1500) });
    const data = await res.json();
    resolved = res.ok && data?.status === "ok" ? api : localStore;
  } catch {
    resolved = localStore;
  }
  return resolved;
}

// Test helper: reset the memoized store between cases.
export function __resetStore() {
  resolved = null;
}
