"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "cissp-progress-v1";

export type ProgressData = {
  known: number[];
  favorites: number[];
};

const defaultData: ProgressData = { known: [], favorites: [] };

function readStorage(): ProgressData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as ProgressData;
    return {
      known: Array.isArray(parsed.known) ? parsed.known : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
    };
  } catch {
    return defaultData;
  }
}

export function useProgress() {
  const [data, setData] = useState<ProgressData>(defaultData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(readStorage());
    setReady(true);
  }, []);

  const persist = useCallback((next: ProgressData) => {
    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleKnown = useCallback(
    (id: number) => {
      setData((prev) => {
        const known = prev.known.includes(id)
          ? prev.known.filter((x) => x !== id)
          : [...prev.known, id];
        const next = { ...prev, known };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const markKnown = useCallback((id: number, known: boolean) => {
    setData((prev) => {
      const set = new Set(prev.known);
      if (known) set.add(id);
      else set.delete(id);
      const next = { ...prev, known: [...set] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: number) => {
    setData((prev) => {
      const favorites = prev.favorites.includes(id)
        ? prev.favorites.filter((x) => x !== id)
        : [...prev.favorites, id];
      const next = { ...prev, favorites };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    persist(defaultData);
  }, [persist]);

  const knownSet = useMemo(() => new Set(data.known), [data.known]);
  const favoriteSet = useMemo(() => new Set(data.favorites), [data.favorites]);

  return {
    ready,
    known: data.known,
    favorites: data.favorites,
    knownSet,
    favoriteSet,
    toggleKnown,
    markKnown,
    toggleFavorite,
    resetProgress,
    knownCount: data.known.length,
    favoriteCount: data.favorites.length,
  };
}
