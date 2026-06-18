"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/LanguageProvider";
import { useProgress } from "@/hooks/use-progress";
import { domains } from "@/lib/glossary";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  Layers,
  Search,
  Sparkles,
  Table2,
  Zap,
} from "lucide-react";

const modes = [
  {
    href: "/glossary?mode=search",
    icon: Search,
    title: { en: "Instant search", nl: "Direct zoeken" },
    desc: {
      en: "MiniSearch index — fuzzy, prefix, <5ms for 400 terms.",
      nl: "MiniSearch-index — fuzzy, prefix, <5ms voor 400 begrippen.",
    },
  },
  {
    href: "/glossary?mode=table",
    icon: Table2,
    title: { en: "Virtual table", nl: "Virtuele tabel" },
    desc: {
      en: "All 400 terms, virtualized rows, filter by domain or favorites.",
      nl: "Alle 400 begrippen, gevirtualiseerde rijen, filter op domein of favorieten.",
    },
  },
  {
    href: "/glossary?mode=cards",
    icon: Layers,
    title: { en: "Flashcards", nl: "Flashcards" },
    desc: {
      en: "Keyboard shortcuts: Space, ←→, 1/2. Progress saved locally.",
      nl: "Sneltoetsen: Spatie, ←→, 1/2. Voortgang lokaal opgeslagen.",
    },
  },
  {
    href: "/glossary?mode=quiz",
    icon: Sparkles,
    title: { en: "Quiz mode", nl: "Quiz-modus" },
    desc: {
      en: "Multiple choice — pick the correct definition.",
      nl: "Meerkeuze — kies de juiste definitie.",
    },
  },
];

export default function HomePage() {
  const { language } = useLanguage();
  const { knownCount, favoriteCount, ready } = useProgress();
  const progressPct = ready ? Math.round((knownCount / 400) * 100) : 0;

  return (
    <AppShell>
      <section className="mb-12 space-y-4">
        <Badge variant="secondary" className="font-mono text-[10px]">
          <Zap className="size-3 mr-1 inline" />
          {language === "nl" ? "400 begrippen · 8 domeinen" : "400 terms · 8 domains"}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-gradient max-w-2xl">
          {language === "nl"
            ? "Leer CISSP-begrippen razendsnel"
            : "Learn CISSP terms at lightning speed"}
        </h1>
        <p className="max-w-xl text-muted-foreground text-lg">
          {language === "nl"
            ? "Zoek, oefen en test je kennis. Nederlands en Engels. Druk ⌘K om overal te zoeken."
            : "Search, practice, and test your knowledge. Dutch and English. Press ⌘K to search anywhere."}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/glossary?mode=search"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            {language === "nl" ? "Begin met zoeken" : "Start searching"}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/glossary?mode=quiz"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted transition-colors"
          >
            {language === "nl" ? "Start quiz" : "Start quiz"}
          </Link>
        </div>
      </section>

      {ready && (
        <Card className="mb-10 glow-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{language === "nl" ? "Jouw voortgang" : "Your progress"}</CardTitle>
            <CardDescription>
              {knownCount}/400 {language === "nl" ? "geleerd" : "learned"} · {favoriteCount}{" "}
              {language === "nl" ? "favorieten" : "favorites"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPct} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground font-mono">{progressPct}%</p>
          </CardContent>
        </Card>
      )}

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        {language === "nl" ? "Leermethoden" : "Learning modes"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 mb-12">
        {modes.map((m) => (
          <Link key={m.href} href={m.href} className="group">
            <Card className="h-full transition-colors hover:border-foreground/20 hover:bg-card/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-secondary">
                    <m.icon className="size-4" />
                  </div>
                  <CardTitle className="text-base">{m.title[language]}</CardTitle>
                </div>
                <CardDescription>{m.desc[language]}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        {language === "nl" ? "CISSP-domeinen" : "CISSP domains"}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {domains.map((d) => (
          <Link key={d.id} href={`/domains/${d.id}`}>
            <Card className="h-full transition-colors hover:border-foreground/20">
              <CardHeader className="p-4">
                <Badge variant="secondary" className="w-fit font-mono text-[10px] mb-2">
                  D{d.id}
                </Badge>
                <CardTitle className="text-sm leading-snug">
                  {language === "nl" ? d.nameNl : d.name}
                </CardTitle>
                <CardDescription className="text-xs">50 terms</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
