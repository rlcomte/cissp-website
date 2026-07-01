"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TermStats } from "@/lib/difficulty";

const STORAGE_KEY = "cissp-progress-v1";

export type ProgressData = {
  known: number[];
  favorites: number[];
  /** Per-term quiz results, the real signal behind difficulty ranking. */
  stats: TermStats;
  /** Last 4-digit sync code this device saved to, so re-saving updates the same record. */
  code?: string;
};

const defaultData: ProgressData = { known: [], favorites: [], stats: {} };

function sanitizeStats(value: unknown): TermStats {
  if (!value || typeof value !== "object") return {};
  const out: TermStats = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const id = Number(key);
    const s = raw as { seen?: unknown; wrong?: unknown };
    if (
      Number.isInteger(id) &&
      s &&
      Number.isFinite(Number(s.seen)) &&
      Number.isFinite(Number(s.wrong))
    ) {
      const seen = Math.max(0, Math.floor(Number(s.seen)));
      const wrong = Math.max(0, Math.min(seen, Math.floor(Number(s.wrong))));
      if (seen > 0) out[id] = { seen, wrong };
    }
  }
  return out;
}

function readStorage(): ProgressData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as ProgressData;
    return {
      known: Array.isArray(parsed.known) ? parsed.known : [],
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      stats: sanitizeStats(parsed.stats),
      code: typeof parsed.code === "string" ? parsed.code : undefined,
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

  /** Record a single quiz answer for a term (drives measured difficulty). */
  const recordAttempt = useCallback((id: number, correct: boolean) => {
    setData((prev) => {
      const prevStat = prev.stats[id] ?? { seen: 0, wrong: 0 };
      const stats = {
        ...prev.stats,
        [id]: {
          seen: prevStat.seen + 1,
          wrong: prevStat.wrong + (correct ? 0 : 1),
        },
      };
      const next = { ...prev, stats };
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

  /** Merge progress restored from a sync code into local progress (union, never loses data). */
  const importProgress = useCallback(
    (incoming: { known?: number[]; favorites?: number[]; stats?: TermStats; code?: string }) => {
      setData((prev) => {
        const known = [...new Set([...prev.known, ...(incoming.known ?? [])])];
        const favorites = [...new Set([...prev.favorites, ...(incoming.favorites ?? [])])];
        const stats: TermStats = { ...prev.stats };
        for (const [key, s] of Object.entries(incoming.stats ?? {})) {
          const id = Number(key);
          const base = stats[id] ?? { seen: 0, wrong: 0 };
          stats[id] = { seen: base.seen + s.seen, wrong: base.wrong + s.wrong };
        }
        const next: ProgressData = { known, favorites, stats, code: incoming.code ?? prev.code };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  /** Remember the sync code this device last saved to. */
  const setSyncCode = useCallback((code: string) => {
    setData((prev) => {
      const next: ProgressData = { ...prev, code };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const knownSet = useMemo(() => new Set(data.known), [data.known]);
  const favoriteSet = useMemo(() => new Set(data.favorites), [data.favorites]);

  return {
    ready,
    known: data.known,
    favorites: data.favorites,
    stats: data.stats,
    knownSet,
    favoriteSet,
    toggleKnown,
    markKnown,
    recordAttempt,
    toggleFavorite,
    resetProgress,
    importProgress,
    setSyncCode,
    code: data.code,
    knownCount: data.known.length,
    favoriteCount: data.favorites.length,
  };
}
