"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

const STATUS_PAGE = "https://cispp.status.ipulse.one/";
const STATUS_API = "https://api.ipulse.one/public/status/cispp/check";

type StatusState = "loading" | "operational" | "degraded" | "down" | "unknown";

type StatusResponse = {
  status?: string;
  name?: string;
  updatedAt?: string;
};

const DOWN_STATUSES = new Set(["down", "outage", "major_outage", "offline"]);
const DEGRADED_STATUSES = new Set(["degraded", "partial_outage", "maintenance", "minor"]);

function mapStatus(raw?: string): StatusState {
  if (!raw) return "unknown";
  const value = raw.toLowerCase();
  if (value === "operational" || value === "up" || value === "ok") return "operational";
  if (DOWN_STATUSES.has(value)) return "down";
  if (DEGRADED_STATUSES.has(value)) return "degraded";
  return "unknown";
}

const COPY: Record<StatusState, { en: string; nl: string; dot: string }> = {
  loading: { en: "Checking status…", nl: "Status ophalen…", dot: "bg-muted-foreground animate-pulse" },
  operational: { en: "All systems operational", nl: "Alles online", dot: "bg-emerald-500" },
  degraded: { en: "Degraded performance", nl: "Verminderde werking", dot: "bg-amber-500" },
  down: { en: "Service disruption", nl: "Storing", dot: "bg-red-500" },
  unknown: { en: "Status unknown", nl: "Status onbekend", dot: "bg-muted-foreground" },
};

export function StatusIndicator() {
  const { language } = useLanguage();
  const [state, setState] = useState<StatusState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(STATUS_API, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as StatusResponse;
        if (!cancelled) setState(mapStatus(data.status));
      } catch {
        if (!cancelled) setState("unknown");
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const copy = COPY[state];
  const label = language === "nl" ? copy.nl : copy.en;

  return (
    <a
      href={STATUS_PAGE}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-0.5 transition-colors hover:border-border hover:text-foreground"
    >
      <span className={`size-2 rounded-full ${copy.dot}`} aria-hidden />
      <span>{label}</span>
    </a>
  );
}
