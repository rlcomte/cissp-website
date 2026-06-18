"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useProgress } from "@/hooks/use-progress";
import { domains, getDomainLabel, getTermDefinition, getTermLabel, glossary } from "@/lib/glossary";
import { t } from "@/lib/i18n";
import { cn, shuffle } from "@/lib/utils";
import type { GlossaryTerm } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Kbd } from "@/components/ui/kbd";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from "lucide-react";

type FlipCardsProps = {
  domainFilter?: number;
};

export function FlipCards({ domainFilter }: FlipCardsProps) {
  const { language } = useLanguage();
  const { knownSet, markKnown, knownCount } = useProgress();
  const [selectedDomain, setSelectedDomain] = useState<string>(
    domainFilter ? String(domainFilter) : "all",
  );
  const [deck, setDeck] = useState<GlossaryTerm[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const pool = useMemo(() => {
    const domainPool =
      selectedDomain === "all"
        ? glossary
        : glossary.filter((t) => t.domain === Number(selectedDomain));
    return domainPool.filter((t) => !knownSet.has(t.id));
  }, [selectedDomain, knownSet]);

  const resetDeck = useCallback(
    (shuffled = true) => {
      setDeck(shuffled ? shuffle(pool) : [...pool]);
      setIndex(0);
      setFlipped(false);
    },
    [pool],
  );

  useEffect(() => {
    resetDeck(true);
  }, [resetDeck]);

  const current = deck[index];

  const nextCard = useCallback(
    (mark?: boolean) => {
      if (!current) return;
      setFlipped(false);

      if (mark === true) {
        markKnown(current.id, true);
        setDeck((prev) => {
          const next = prev.filter((t) => t.id !== current.id);
          return next;
        });
        setIndex((i) => {
          const remaining = deck.length - 1;
          if (remaining <= 0) return 0;
          return i >= remaining ? 0 : i;
        });
        return;
      }

      if (mark === false) markKnown(current.id, false);
      setIndex((i) => (deck.length <= 1 ? 0 : i + 1 >= deck.length ? 0 : i + 1));
    },
    [current, deck.length, markKnown],
  );

  const prevCard = useCallback(() => {
    setFlipped(false);
    setIndex((i) => (i - 1 < 0 ? deck.length - 1 : i - 1));
  }, [deck.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === "ArrowRight") nextCard();
      else if (e.code === "ArrowLeft") prevCard();
      else if (e.key === "1") nextCard(false);
      else if (e.key === "2") nextCard(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextCard, prevCard]);

  if (pool.length === 0) {
    return (
      <Card className="py-16 text-center space-y-2">
        <p className="text-lg font-medium">
          {language === "nl" ? "Alles geleerd!" : "All learned!"}
        </p>
        <p className="text-sm text-muted-foreground">
          {language === "nl"
            ? "Je hebt alle begrippen in deze selectie als geleerd gemarkeerd."
            : "You marked all terms in this selection as learned."}
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          {knownCount}/400 {t("learned", language)}
        </p>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card className="py-16 text-center text-muted-foreground">
        {language === "nl" ? "Geen kaarten beschikbaar." : "No cards available."}
      </Card>
    );
  }

  const frontLabel = getTermLabel(current, language);
  const backText = getTermDefinition(current, language);
  const domainLabel = getDomainLabel(current, language);
  const isKnown = knownSet.has(current.id);
  const deckProgress = deck.length ? ((index + 1) / deck.length) * 100 : 0;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedDomain} onValueChange={(v) => v && setSelectedDomain(v)}>
          <SelectTrigger className="bg-card">
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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => resetDeck(true)} className="flex-1 sm:flex-none">
            <Shuffle className="size-3.5" />
            {t("shuffle", language)}
          </Button>
          <Badge variant="secondary" className="font-mono shrink-0">
            {index + 1}/{deck.length}
          </Badge>
          <Badge variant="outline" className="font-mono text-success border-success/30 text-[10px] sm:text-xs">
            {knownCount} {t("learned", language)} · {pool.length}{" "}
            {language === "nl" ? "te oefenen" : "left"}
          </Badge>
        </div>
      </div>

      <Progress value={deckProgress} className="h-1" />

      <div
        className="flip-scene w-full cursor-pointer select-none"
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        aria-label={language === "nl" ? "Kaart omdraaien" : "Flip card"}
      >
        <div
          className={cn(
            "flip-inner min-h-[260px] sm:min-h-[340px]",
            flipped && "flipped",
          )}
        >
          <div
            className={cn(
              "flip-face flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 sm:p-8 text-center shadow-sm",
              isKnown && "border-success/40",
            )}
          >
            <Badge variant="secondary" className="mb-3 sm:mb-4 font-mono text-[10px] max-w-[90%] truncate">
              D{current.domain} · {domainLabel}
            </Badge>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t("term", language)}
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight px-2">{frontLabel}</h2>
            <p className="mt-auto pt-4 text-xs text-muted-foreground">
              {t("flipHint", language)}
              <span className="hidden sm:inline">
                {" "}
                <Kbd>Space</Kbd>
              </span>
              <span className="sm:hidden"> ({language === "nl" ? "tik" : "tap"})</span>
            </p>
          </div>
          <div className="flip-face flip-back flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 sm:p-8 text-center shadow-sm">
            <Badge variant="outline" className="mb-3 sm:mb-4 font-mono text-[10px]">
              #{current.id}
            </Badge>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t("definition", language)}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground max-h-[180px] sm:max-h-[200px] overflow-y-auto px-2">
              {backText}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={prevCard}>
          <ChevronLeft className="size-4" />
          {t("previous", language)}
        </Button>
        <Button variant="destructive" size="sm" onClick={() => nextCard(false)}>
          <RotateCcw className="size-3.5" />
          {t("stillLearning", language)}
          <Kbd className="ml-1 hidden sm:inline-flex">1</Kbd>
        </Button>
        <Button size="sm" onClick={() => nextCard(true)}>
          {t("gotIt", language)}
          <Kbd className="ml-1 hidden sm:inline-flex bg-primary-foreground/20">2</Kbd>
        </Button>
        <Button variant="outline" size="sm" onClick={() => nextCard()}>
          {t("next", language)}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
