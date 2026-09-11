"use client";

import { useEffect, useState } from "react";
import type { LocalMemoryStore } from "@/data/progress";
import { memoryStoreUpdatedEvent } from "@/data/progress";

// Module-level global cache that persists across client-side page transitions
const MEMORIES_STORAGE_KEY = "map_of_us_memories_v1";

function readStoredMemories(): LocalMemoryStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEMORIES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return null;
}

function writeStoredMemories(memories: LocalMemoryStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(memories));
  } catch {}
}

let cachedMemories: LocalMemoryStore | null = null;
let inflightPromise: Promise<LocalMemoryStore> | null = null;

export function getCachedMemories(): LocalMemoryStore | null {
  if (!cachedMemories && typeof window !== "undefined") {
    cachedMemories = readStoredMemories();
  }
  return cachedMemories;
}

export function setCachedMemories(memories: LocalMemoryStore) {
  cachedMemories = memories;
  writeStoredMemories(memories);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(memoryStoreUpdatedEvent, { detail: memories })
    );
  }
}

export async function fetchLocalMemories(force = false): Promise<LocalMemoryStore> {
  if (!force && cachedMemories && Object.keys(cachedMemories).length > 0) {
    return cachedMemories;
  }

  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    try {
      const response = await fetch("/api/memories", { cache: "no-store" });
      if (!response.ok) {
        return cachedMemories ?? readStoredMemories() ?? {};
      }
      const data = (await response.json().catch(() => null)) as {
        memories?: LocalMemoryStore;
      } | null;

      if (data?.memories) {
        cachedMemories = data.memories;
        writeStoredMemories(data.memories);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent(memoryStoreUpdatedEvent, { detail: data.memories })
          );
        }
        return data.memories;
      }
    } catch (error) {
      console.error("fetchLocalMemories failed:", error);
    } finally {
      inflightPromise = null;
    }
    return cachedMemories ?? readStoredMemories() ?? {};
  })();

  return inflightPromise;
}

export function useLocalMemories(): {
  localMemories: LocalMemoryStore;
  loading: boolean;
} {
  const [localMemories, setLocalMemories] = useState<LocalMemoryStore>(() => {
    if (cachedMemories && Object.keys(cachedMemories).length > 0) {
      return cachedMemories;
    }
    const stored = readStoredMemories();
    if (stored && Object.keys(stored).length > 0) {
      cachedMemories = stored;
      return stored;
    }
    return {};
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const hasCache =
      (cachedMemories && Object.keys(cachedMemories).length > 0) ||
      Boolean(readStoredMemories());
    return !hasCache;
  });

  useEffect(() => {
    let isMounted = true;

    // If cache was populated after initial render, sync immediately
    if (cachedMemories && Object.keys(cachedMemories).length > 0) {
      setLocalMemories(cachedMemories);
      setLoading(false);
    } else {
      const stored = readStoredMemories();
      if (stored && Object.keys(stored).length > 0) {
        cachedMemories = stored;
        setLocalMemories(stored);
        setLoading(false);
      }
    }

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<LocalMemoryStore>).detail;
      if (detail) {
        cachedMemories = detail;
        if (isMounted) {
          setLocalMemories(detail);
          setLoading(false);
        }
      }
    };

    window.addEventListener(memoryStoreUpdatedEvent, handleUpdate);

    // Revalidate in background (or fetch if not cached)
    fetchLocalMemories(true)
      .then((data) => {
        if (isMounted) {
          if (data && Object.keys(data).length > 0) {
            setLocalMemories(data);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      window.removeEventListener(memoryStoreUpdatedEvent, handleUpdate);
    };
  }, []);

  return { localMemories, loading };
}
