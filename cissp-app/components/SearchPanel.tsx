"use client";

import { memo, useDeferredValue, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useProgress } from "@/hooks/use-progress";
import {
  getDomainLabel,
  getTermDefinition,
  getTermLabel,
} from "@/lib/glossary";
import { searchGlossary } from "@/lib/search";
import { t } from "@/lib/i18n";
import { cn, highlightMatch } from "@/lib/utils";
import type { GlossaryTerm } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Search, Star, StarOff, Check } from "lucide-react";

type SearchPanelProps = {
  domainFilter?: number;
  initialQuery?: string;
};

export function SearchPanel({ domainFilter, initialQuery = "" }: SearchPanelProps) {
  const { language } = useLanguage();
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const { favoriteSet, toggleFavorite, knownSet, toggleKnown } = useProgress();
  const [copied, setCopied] = useState<number | null>(null);

  const results = useMemo(
    () => searchGlossary(deferredQuery, domainFilter),
    [deferredQuery, domainFilter],
  );

  const isStale = query !== deferredQuery;

  async function copyTerm(term: GlossaryTerm) {
    const text = `${getTermLabel(term, language)}: ${getTermDefinition(term, language)}`;
    await navigator.clipboard.writeText(text);
    setCopied(term.id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder", language)}
          className="h-11 pl-10 pr-24 bg-card border-border/80"
          autoFocus
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
            onClick={() => setQuery("")}
          >
            {t("clear", language)}
          </Button>
        )}
      </div>

      <p className={cn("text-sm text-muted-foreground", isStale && "opacity-60")}>
        {results.length} {t("results", language)}
        {deferredQuery ? ` · “${deferredQuery}”` : ""}
      </p>

      <div className="grid gap-2">
        {results.slice(0, 80).map((term) => (
          <TermCard
            key={term.id}
            term={term}
            query={deferredQuery}
            language={language}
            isFavorite={favoriteSet.has(term.id)}
            isKnown={knownSet.has(term.id)}
            isCopied={copied === term.id}
            onToggleFavorite={() => toggleFavorite(term.id)}
            onToggleKnown={() => toggleKnown(term.id)}
            onCopy={() => copyTerm(term)}
          />
        ))}
        {results.length > 80 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            +{results.length - 80} {language === "nl" ? "meer — verfijn zoekopdracht" : "more — refine search"}
          </p>
        )}
        {results.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("noResults", language)}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

const TermCard = memo(function TermCard({
  term,
  query,
  language,
  isFavorite,
  isKnown,
  isCopied,
  onToggleFavorite,
  onToggleKnown,
  onCopy,
}: {
  term: GlossaryTerm;
  query: string;
  language: "en" | "nl";
  isFavorite: boolean;
  isKnown: boolean;
  isCopied: boolean;
  onToggleFavorite: () => void;
  onToggleKnown: () => void;
  onCopy: () => void;
}) {
  const label = getTermLabel(term, language);
  const definition = getTermDefinition(term, language);
  const domain = getDomainLabel(term, language);

  return (
    <Card className="group glow-border transition-colors hover:border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">#{term.id}</span>
            <Badge variant="secondary" className="text-[10px] font-mono">
              D{term.domain}
            </Badge>
            {isKnown && (
              <Badge variant="outline" className="text-[10px] text-success border-success/30">
                ✓
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg font-semibold">
            <HighlightText text={label} query={query} />
          </CardTitle>
          <p className="text-xs text-muted-foreground truncate">{domain}</p>
        </div>
        <div className="flex shrink-0 gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-xs" onClick={onToggleKnown} title="Known" className="size-8 sm:size-6">
            <Check className={cn("size-3.5", isKnown && "text-success")} />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onToggleFavorite} className="size-8 sm:size-6">
            {isFavorite ? (
              <Star className="size-3.5 fill-primary text-primary" />
            ) : (
              <StarOff className="size-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onCopy} className="size-8 sm:size-6">
            {isCopied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="text-base text-muted-foreground leading-relaxed">
        <HighlightText text={definition} query={query} />
      </CardContent>
    </Card>
  );
});

function HighlightText({ text, query }: { text: string; query: string }) {
  const parts = highlightMatch(text, query);
  return (
    <>
      {parts.map((p, i) =>
        p.match ? (
          <mark key={i} className="search-highlight">
            {p.text}
          </mark>
        ) : (
          p.text
        ),
      )}
    </>
  );
}
