"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { ProgressSync } from "@/components/ProgressSync";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";

type FlipCardsProps = {
  domainFilter?: number;
};

// How many cards before a "Hard"-rated card reappears (spaced repetition, session-local).
const HARD_GAP = 3;

export function FlipCards({ domainFilter }: FlipCardsProps) {
  const { language } = useLanguage();
  const { knownSet, markKnown, knownCount, ready } = useProgress();
  const [selectedDomain, setSelectedDomain] = useState<string>(
    domainFilter ? String(domainFilter) : "all",
  );
  const [deck, setDeck] = useState<GlossaryTerm[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Latest values mirrored into refs so the keyboard handler and rating callbacks
  // stay stable and never read stale state.
  const knownSetRef = useRef(knownSet);
  knownSetRef.current = knownSet;
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const indexRef = useRef(index);
  indexRef.current = index;

  // Build a fresh shuffled deck of not-yet-known terms for the selected domain.
  const buildDeck = useCallback(() => {
    const domainPool =
      selectedDomain === "all"
        ? glossary
        : glossary.filter((term) => term.domain === Number(selectedDomain));
    return shuffle(domainPool.filter((term) => !knownSetRef.current.has(term.id)));
  }, [selectedDomain]);

  const resetDeck = useCallback(() => {
    setDeck(buildDeck());
    setIndex(0);
    setFlipped(false);
  }, [buildDeck]);

  // Build the deck once progress is loaded and whenever the domain changes.
  // Crucially NOT on every knownSet change — that was resetting the deck mid-session.
  useEffect(() => {
    if (!ready) return;
    setDeck(buildDeck());
    setIndex(0);
    setFlipped(false);
  }, [ready, buildDeck]);

  const current = deck[index];

  // Rate the current card: "hard" requeues it soon, "easy" sends it to the back,
  // "known" removes it from the session and persists it as learned.
  const rate = useCallback(
    (kind: "hard" | "easy" | "known") => {
      const prev = deckRef.current;
      if (prev.length === 0) return;
      setFlipped(false);

      const idx = Math.min(indexRef.current, prev.length - 1);
      const arr = [...prev];
      const [card] = arr.splice(idx, 1);

      let newIndex: number;
      if (kind === "known") {
        markKnown(card.id, true);
        // card stays out of the deck; show whatever shifted into this slot
        newIndex = idx >= arr.length ? 0 : idx;
      } else {
        if (kind === "hard") {
          arr.splice(Math.min(idx + HARD_GAP, arr.length), 0, card);
        } else {
          arr.push(card);
        }
        // deck length unchanged; advance unless we were on the last card
        newIndex = idx >= arr.length - 1 ? 0 : idx;
      }

      setDeck(arr);
      setIndex(newIndex);
    },
    [markKnown],
  );

  // Plain navigation (skip / go back) without changing what's learned.
  const go = useCallback((dir: 1 | -1) => {
    const len = deckRef.current.length;
    if (len === 0) return;
    setFlipped(false);
    setIndex((i) => (dir === 1 ? (i + 1) % len : (i - 1 + len) % len));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === "ArrowRight") go(1);
      else if (e.code === "ArrowLeft") go(-1);
      else if (e.key === "1") rate("hard");
      else if (e.key === "2") rate("easy");
      else if (e.key === "3") rate("known");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rate, go]);

  if (!ready) {
    return (
      <Card className="py-16 text-center text-muted-foreground">
        {language === "nl" ? "Laden…" : "Loading…"}
      </Card>
    );
  }

  if (deck.length === 0) {
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
          <Button variant="outline" size="sm" onClick={resetDeck} className="flex-1 sm:flex-none">
            <Shuffle className="size-3.5" />
            {t("shuffle", language)}
          </Button>
          <ProgressSync />
          <Badge variant="secondary" className="font-mono shrink-0">
            {index + 1}/{deck.length}
          </Badge>
          <Badge variant="outline" className="font-mono text-success border-success/30 text-[10px] sm:text-xs">
            {knownCount} {t("learned", language)} · {deck.length}{" "}
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
        <div className={cn("flip-inner min-h-[260px] sm:min-h-[340px]", flipped && "is-flipped")}>
          <div
            aria-hidden={flipped}
            className={cn(
              "flip-face flip-front flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 sm:p-8 text-center shadow-sm",
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
          <div
            aria-hidden={!flipped}
            className="flip-face flip-back flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 sm:p-8 text-center shadow-sm"
          >
            <Badge variant="outline" className="mb-3 sm:mb-4 font-mono text-[10px]">
              #{current.id}
            </Badge>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {t("definition", language)}
            </p>
            {/* scroll lives on an inner child, never on the backface element itself */}
            <div className="max-h-[180px] sm:max-h-[200px] overflow-y-auto px-2">
              <p className="text-sm leading-relaxed text-muted-foreground">{backText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => go(-1)} aria-label={t("previous", language)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => rate("hard")}>
          {t("hard", language)}
          <Kbd className="ml-1 hidden sm:inline-flex">1</Kbd>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => rate("easy")}>
          {t("easy", language)}
          <Kbd className="ml-1 hidden sm:inline-flex">2</Kbd>
        </Button>
        <Button size="sm" onClick={() => rate("known")}>
          {t("gotIt", language)}
          <Kbd className="ml-1 hidden sm:inline-flex bg-primary-foreground/20">3</Kbd>
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => go(1)} aria-label={t("next", language)}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">{t("srHint", language)}</p>
    </div>
  );
}
