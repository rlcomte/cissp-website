"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { getPageTitle, type PageMeta } from "@/lib/pages";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BookOpen, Briefcase, FileText, Globe } from "lucide-react";

const categoryIcon = {
  domain: BookOpen,
  case: Briefcase,
  opdracht: FileText,
  overview: Globe,
  other: FileText,
};

const categoryLabel = {
  domain: { en: "Theory", nl: "Theorie" },
  case: { en: "Scenarios", nl: "Scenario's" },
  opdracht: { en: "Assignments", nl: "Opdrachten" },
  overview: { en: "Overview", nl: "Overzicht" },
  other: { en: "Other", nl: "Overig" },
};

type LearnIndexProps = {
  pages: PageMeta[];
  compact?: boolean;
};

export function LearnIndex({ pages, compact }: LearnIndexProps) {
  const { language } = useLanguage();

  if (compact) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {pages.map((page) => (
          <Link key={page.slug} href={`/learn/${page.slug}`}>
            <Card className="h-full transition-colors hover:border-foreground/20">
              <CardHeader className="p-4">
                <CardTitle className="text-sm">{getPageTitle(page, language)}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {page.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    );
  }

  const grouped = pages.reduce(
    (acc, page) => {
      if (!acc[page.category]) acc[page.category] = [];
      acc[page.category].push(page);
      return acc;
    },
    {} as Record<string, PageMeta[]>,
  );

  const order = ["overview", "domain", "case", "opdracht", "other"] as const;

  return (
    <div className="space-y-10">
      {order.map((cat) => {
        const items = grouped[cat];
        if (!items?.length) return null;
        const Icon = categoryIcon[cat];
        return (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-4">
              <Icon className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {categoryLabel[cat][language]}
              </h2>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {items.length}
              </Badge>
            </div>
            <div className={cn("grid gap-2", cat === "domain" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2")}>
              {items.map((page) => (
                <Link key={page.slug} href={`/learn/${page.slug}`}>
                  <Card className="h-full transition-colors hover:border-foreground/20 hover:bg-card/80">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        {page.domainId && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            D{page.domainId}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {categoryLabel[page.category][language]}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm leading-snug">
                        {getPageTitle(page, language)}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {page.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
