"use client";

import { useEffect, useState } from "react";
import type { LocalMemoryStore } from "@/data/progress";
import { memoryStoreUpdatedEvent } from "@/data/progress";

// Module-level global cache that persists across client-side page transitions
let cachedMemories: LocalMemoryStore | null = null;
let inflightPromise: Promise<LocalMemoryStore> | null = null;

export function getCachedMemories(): LocalMemoryStore | null {
  return cachedMemories;
}

export function setCachedMemories(memories: LocalMemoryStore) {
  cachedMemories = memories;
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
        return cachedMemories ?? {};
      }
      const data = (await response.json().catch(() => null)) as {
        memories?: LocalMemoryStore;
      } | null;

      if (data?.memories) {
        cachedMemories = data.memories;
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
    return cachedMemories ?? {};
  })();

  return inflightPromise;
}

export function useLocalMemories(): {
  localMemories: LocalMemoryStore;
  loading: boolean;
} {
  const [localMemories, setLocalMemories] = useState<LocalMemoryStore>(
    () => cachedMemories ?? {}
  );
  const [loading, setLoading] = useState<boolean>(
    () => !cachedMemories || Object.keys(cachedMemories).length === 0
  );

  useEffect(() => {
    let isMounted = true;

    // If cache was populated after useState initialized, sync immediately
    if (cachedMemories && Object.keys(cachedMemories).length > 0) {
      setLocalMemories(cachedMemories);
      setLoading(false);
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

    // If cache is empty or incomplete, trigger background fetch (deduplicated!)
    if (!cachedMemories || Object.keys(cachedMemories).length === 0) {
      fetchLocalMemories().then((data) => {
        if (isMounted && data && Object.keys(data).length > 0) {
          setLocalMemories(data);
          setLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
      window.removeEventListener(memoryStoreUpdatedEvent, handleUpdate);
    };
  }, []);

  return { localMemories, loading };
}
