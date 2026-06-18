"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { SearchPanel } from "@/components/SearchPanel";
import { GlossaryTable } from "@/components/GlossaryTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Search, Sparkles, Table2 } from "lucide-react";

const FlipCards = dynamic(
  () => import("@/components/FlipCards").then((m) => m.FlipCards),
  { loading: () => <Skeleton className="h-[400px] w-full rounded-xl" /> },
);

const QuizMode = dynamic(
  () => import("@/components/QuizMode").then((m) => m.QuizMode),
  { loading: () => <Skeleton className="h-[400px] w-full rounded-xl" /> },
);

type Mode = "search" | "table" | "cards" | "quiz";

export function GlossaryView({ domainFilter }: { domainFilter?: number }) {
  const { language } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramMode = (searchParams.get("mode") as Mode) || "search";
  const initialQuery = searchParams.get("q") ?? "";
  const [mode, setMode] = useState<Mode>(
    ["search", "table", "cards", "quiz"].includes(paramMode) ? paramMode : "search",
  );

  useEffect(() => {
    const m = searchParams.get("mode") as Mode;
    if (m && ["search", "table", "cards", "quiz"].includes(m)) setMode(m);
  }, [searchParams]);

  function onTabChange(value: string) {
    const next = value as Mode;
    setMode(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", next);
    if (next !== "search") params.delete("q");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={mode} onValueChange={onTabChange} className="space-y-6">
      <div className="flex justify-center overflow-x-auto px-4 -mx-4 md:mx-0 md:px-0 scrollbar-none">
        <TabsList className="bg-secondary/50 border border-border h-auto w-fit flex-nowrap gap-1 p-1">
          <TabsTrigger value="search" className="gap-1.5 px-2.5 sm:px-3 data-[state=active]:bg-background">
            <Search className="size-3.5 shrink-0" />
            <span className="max-sm:sr-only">{language === "nl" ? "Zoeken" : "Search"}</span>
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-1.5 px-2.5 sm:px-3 data-[state=active]:bg-background">
            <Table2 className="size-3.5 shrink-0" />
            <span className="max-sm:sr-only">{language === "nl" ? "Tabel" : "Table"}</span>
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-1.5 px-2.5 sm:px-3 data-[state=active]:bg-background">
            <Layers className="size-3.5 shrink-0" />
            <span className="max-sm:sr-only">Flashcards</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-1.5 px-2.5 sm:px-3 data-[state=active]:bg-background">
            <Sparkles className="size-3.5 shrink-0" />
            <span className="max-sm:sr-only">Quiz</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="search" className="mt-0">
        <SearchPanel domainFilter={domainFilter} initialQuery={initialQuery} />
      </TabsContent>
      <TabsContent value="table" className="mt-0">
        <GlossaryTable domainFilter={domainFilter} />
      </TabsContent>
      <TabsContent value="cards" className="mt-0">
        <FlipCards domainFilter={domainFilter} />
      </TabsContent>
      <TabsContent value="quiz" className="mt-0">
        <QuizMode domainFilter={domainFilter} />
      </TabsContent>
    </Tabs>
  );
}

export function GlossaryViewLoader({ domainFilter }: { domainFilter?: number }) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <GlossaryView domainFilter={domainFilter} />
    </Suspense>
  );
}
