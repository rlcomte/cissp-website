"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useProgress } from "@/hooks/use-progress";
import {
  domains,
  getTermDefinition,
  getTermLabel,
  glossary,
} from "@/lib/glossary";
import { rankByDifficulty } from "@/lib/difficulty";
import { t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";

const TOP_N = 25;

type HardestTermsProps = {
  domainFilter?: number;
  onPractice?: () => void;
};

export function HardestTerms({ domainFilter, onPractice }: HardestTermsProps) {
  const { language } = useLanguage();
  const { stats } = useProgress();
  const [selectedDomain, setSelectedDomain] = useState<string>(
    domainFilter ? String(domainFilter) : "all",
  );

  const ranked = useMemo(() => {
    const domain =
      selectedDomain === "all" ? undefined : Number(selectedDomain);
    return rankByDifficulty(glossary, stats, domain).slice(0, TOP_N);
  }, [selectedDomain, stats]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("hardestTitle", language)}</h2>
          <p className="text-sm text-muted-foreground">{t("hardestHint", language)}</p>
        </div>
        {!domainFilter && (
          <Select
            value={selectedDomain}
            onValueChange={(v) => {
              if (v) setSelectedDomain(v);
            }}
          >
            <SelectTrigger className="bg-card sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allDomains", language)}</SelectItem>
              {domains.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  D{d.id} · {language === "nl" ? d.nameNl : d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <ol className="space-y-2">
        {ranked.map((entry, index) => {
          const { term, difficulty, stat } = entry;
          const pct = Math.round(difficulty * 100);
          const measured = stat && stat.seen > 0;
          return (
            <li key={term.id}>
              <Card>
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="w-6 shrink-0 text-center font-mono text-sm text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">
                        {getTermLabel(term, language)}
                      </span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        D{term.domain}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="font-mono text-[10px] text-muted-foreground"
                      >
                        {measured
                          ? `${t("fromResults", language)} · ${stat!.wrong}/${stat!.seen}`
                          : t("estimated", language)}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {getTermDefinition(term, language)}
                    </p>
                  </div>
                  <div className="w-20 shrink-0 space-y-1 text-right sm:w-28">
                    <span className="font-mono text-sm font-semibold">{pct}%</span>
                    <Progress value={pct} className="h-1" />
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>

      {onPractice && (
        <div className="text-center">
          <Button variant="outline" onClick={onPractice} className="gap-1.5">
            <Sparkles className="size-4" />
            {t("practiceThese", language)}
          </Button>
        </div>
      )}
    </div>
  );
}
