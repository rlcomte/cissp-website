"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLanguage } from "@/components/LanguageProvider";
import { useProgress } from "@/hooks/use-progress";
import { domains, getDomainLabel, getTermDefinition, getTermLabel } from "@/lib/glossary";
import { searchGlossary } from "@/lib/search";
import { t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type GlossaryTableProps = {
  domainFilter?: number;
};

export function GlossaryTable({ domainFilter }: GlossaryTableProps) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedDomain, setSelectedDomain] = useState<string>(
    domainFilter ? String(domainFilter) : "all",
  );
  const [showFavorites, setShowFavorites] = useState(false);
  const [showUnknown, setShowUnknown] = useState(false);
  const { favoriteSet, knownSet } = useProgress();
  const parentRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const domain = selectedDomain === "all" ? undefined : Number(selectedDomain);
    let items = searchGlossary(deferredQuery, domain);
    if (showFavorites) items = items.filter((t) => favoriteSet.has(t.id));
    if (showUnknown) items = items.filter((t) => !knownSet.has(t.id));
    return items;
  }, [deferredQuery, selectedDomain, showFavorites, showUnknown, favoriteSet, knownSet]);

  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 8,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("filterTable", language)}
            className="h-10 pl-10 bg-card"
          />
        </div>
        <Select value={selectedDomain} onValueChange={(v) => v && setSelectedDomain(v)}>
          <SelectTrigger className="w-full lg:w-[220px] bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allDomains", language)}</SelectItem>
            {domains.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                D{d.id} — {language === "nl" ? d.nameNl : d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFavorites((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors",
              showFavorites
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <Star className="size-3.5" />
            {t("showFavorites", language)}
          </button>
          <button
            type="button"
            onClick={() => setShowUnknown((v) => !v)}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs transition-colors",
              showUnknown
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t("showUnknown", language)}
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {results.length} {t("of400", language)}
      </p>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="grid grid-cols-[48px_minmax(140px,1fr)_minmax(0,3fr)_130px] gap-4 border-b border-border bg-secondary/40 px-4 py-3 text-xs font-medium text-muted-foreground">
          <span>#</span>
          <span>{t("term", language)}</span>
          <span>{t("definition", language)}</span>
          <span>{t("domain", language)}</span>
        </div>
        <div ref={parentRef} className="h-[min(70vh,600px)] overflow-auto">
          <div
            style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const term = results[virtualRow.index];
              return (
                <div
                  key={term.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="absolute left-0 w-full grid grid-cols-[48px_minmax(140px,1fr)_minmax(0,3fr)_130px] gap-4 border-b border-border/50 px-4 py-3 text-sm hover:bg-secondary/30 transition-colors"
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <span className="font-mono text-xs text-muted-foreground pt-0.5">
                    {term.id}
                  </span>
                  <span className="font-medium flex items-start gap-1.5">
                    {favoriteSet.has(term.id) && (
                      <Star className="size-3 shrink-0 fill-primary text-primary mt-0.5" />
                    )}
                    {getTermLabel(term, language)}
                  </span>
                  <p className="text-muted-foreground leading-relaxed whitespace-normal">
                    {getTermDefinition(term, language)}
                  </p>
                  <div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      D{term.domain}
                    </Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {getDomainLabel(term, language)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
