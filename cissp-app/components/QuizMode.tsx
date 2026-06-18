"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useProgress } from "@/hooks/use-progress";
import { domains, getTermDefinition, getTermLabel, glossary } from "@/lib/glossary";
import { t } from "@/lib/i18n";
import { cn, shuffle } from "@/lib/utils";
import type { GlossaryTerm } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, XCircle } from "lucide-react";

function buildOptions(
  correct: GlossaryTerm,
  distractorPool: GlossaryTerm[],
  lang: "en" | "nl",
) {
  const wrong = shuffle(distractorPool.filter((t) => t.id !== correct.id)).slice(0, 3);
  const options = shuffle([
    { id: correct.id, text: getTermDefinition(correct, lang), correct: true },
    ...wrong.map((t) => ({
      id: t.id,
      text: getTermDefinition(t, lang),
      correct: false,
    })),
  ]);
  return options;
}

type QuizModeProps = {
  domainFilter?: number;
};

export function QuizMode({ domainFilter }: QuizModeProps) {
  const { language } = useLanguage();
  const { markKnown, knownSet, knownCount } = useProgress();
  const [selectedDomain, setSelectedDomain] = useState<string>(
    domainFilter ? String(domainFilter) : "all",
  );
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [current, setCurrent] = useState<GlossaryTerm | null>(null);
  const [options, setOptions] = useState<
    { id: number; text: string; correct: boolean }[]
  >([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  const fullPool = useMemo(() => {
    if (selectedDomain === "all") return glossary;
    return glossary.filter((t) => t.domain === Number(selectedDomain));
  }, [selectedDomain]);

  const pool = useMemo(
    () => fullPool.filter((t) => !knownSet.has(t.id)),
    [fullPool, knownSet],
  );

  const nextQuestion = useCallback(() => {
    if (pool.length === 0) {
      setCurrent(null);
      return;
    }
    const term = pool[Math.floor(Math.random() * pool.length)];
    setCurrent(term);
    setOptions(buildOptions(term, fullPool, language));
    setSelected(null);
  }, [pool, fullPool, language]);

  useEffect(() => {
    if (pool.length === 0) {
      setCurrent(null);
      return;
    }
    if (!current) {
      nextQuestion();
    }
  }, [pool.length, selectedDomain, current, nextQuestion]);

  function pickOption(id: number, correct: boolean) {
    if (selected !== null) return;
    setSelected(id);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      total: s.total + 1,
    }));
    if (correct) {
      setStreak((s) => s + 1);
      if (current) markKnown(current.id, true);
    } else {
      setStreak(0);
    }
  }

  if (pool.length === 0) {
    return (
      <Card className="py-16 text-center space-y-2 max-w-2xl mx-auto">
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

  if (!current) return null;

  const accuracy = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedDomain} onValueChange={(v) => { if (v) { setSelectedDomain(v); setCurrent(null); setScore({ correct: 0, total: 0 }); setStreak(0); } }}>
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
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge variant="secondary" className="font-mono text-[10px] sm:text-xs">
            {t("score", language)}: {score.correct}/{score.total}
          </Badge>
          <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">
            {accuracy}%
          </Badge>
          {streak > 1 && (
            <Badge className="font-mono text-[10px] sm:text-xs bg-success/20 text-success border-success/30">
              🔥 {streak}
            </Badge>
          )}
          <Badge variant="outline" className="font-mono text-[10px] sm:text-xs text-success border-success/30">
            {pool.length} {language === "nl" ? "te oefenen" : "left"}
          </Badge>
        </div>
      </div>

      <Progress value={accuracy} className="h-1" />

      <Card className="glow-border">
        <CardHeader>
          <Badge variant="secondary" className="w-fit font-mono text-[10px] mb-2">
            D{current.domain} · #{current.id}
          </Badge>
          <CardTitle className="text-xl">{getTermLabel(current, language)}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("quizQuestion", language)}</p>
        </CardHeader>
        <CardContent className="grid gap-2">
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            const showResult = selected !== null;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={selected !== null}
                onClick={() => pickOption(opt.id, opt.correct)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left text-sm transition-all",
                  "hover:border-foreground/30 hover:bg-secondary/50",
                  showResult && opt.correct && "border-success/50 bg-success/10",
                  showResult && isSelected && !opt.correct && "border-destructive/50 bg-destructive/10",
                  !showResult && "border-border",
                )}
              >
                <span className="flex items-start gap-2">
                  {showResult && opt.correct && <CheckCircle2 className="size-4 shrink-0 text-success mt-0.5" />}
                  {showResult && isSelected && !opt.correct && <XCircle className="size-4 shrink-0 text-destructive mt-0.5" />}
                  <span className="leading-relaxed">{opt.text}</span>
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {selected !== null && (
        <div className="text-center space-y-3">
          <p className={cn("text-sm font-medium", options.find((o) => o.id === selected)?.correct ? "text-success" : "text-destructive")}>
            {options.find((o) => o.id === selected)?.correct ? t("correct", language) : t("wrong", language)}
          </p>
          <Button onClick={nextQuestion}>
            {language === "nl" ? "Volgende vraag" : "Next question"}
          </Button>
        </div>
      )}
    </div>
  );
}
