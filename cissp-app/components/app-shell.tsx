"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { CommandTrigger } from "@/components/command-menu";
import { useProgress } from "@/hooks/use-progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookOpen, GraduationCap, Layers, Search, Sparkles, Table2 } from "lucide-react";

const nav = [
  { href: "/", label: { en: "Home", nl: "Home" }, icon: BookOpen },
  { href: "/learn", label: { en: "Learn", nl: "Leren" }, icon: GraduationCap },
  { href: "/glossary?mode=search", label: { en: "Search", nl: "Zoeken" }, icon: Search },
  { href: "/glossary?mode=table", label: { en: "Table", nl: "Tabel" }, icon: Table2 },
  { href: "/glossary?mode=cards", label: { en: "Cards", nl: "Kaarten" }, icon: Layers },
  { href: "/glossary?mode=quiz", label: { en: "Quiz", nl: "Quiz" }, icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const { knownCount, ready } = useProgress();
  const progressPct = ready ? Math.round((knownCount / 400) * 100) : 0;

  return (
    <div className="relative min-h-screen vercel-grid">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight shrink-0">
            <span className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-xs font-bold">
              C
            </span>
            <span className="hidden sm:inline">CISSP</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/learn"
                    ? pathname.startsWith("/learn")
                    : pathname.startsWith("/glossary") && item.href.includes("mode=");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.95rem] transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label[language]}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {ready && (
              <div className="flex lg:hidden items-center gap-1.5 min-w-0">
                <Progress value={progressPct} className="h-1.5 w-12 sm:w-20" />
                <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">{progressPct}%</span>
              </div>
            )}
            {ready && (
              <div className="hidden lg:flex items-center gap-2 min-w-[120px]">
                <Progress value={progressPct} className="h-1.5 w-20" />
                <span className="text-xs text-muted-foreground font-mono">{progressPct}%</span>
              </div>
            )}
            <CommandTrigger />
            <ThemeToggle />
            <div className="flex rounded-lg border border-border p-0.5">
              <Button
                variant={language === "en" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setLanguage("en")}
                className="h-7 px-2.5 font-mono text-xs"
              >
                EN
              </Button>
              <Button
                variant={language === "nl" ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setLanguage("nl")}
                className="h-7 px-2.5 font-mono text-xs"
              >
                NL
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:py-8 md:pb-8">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom,0px)]"
        aria-label={language === "nl" ? "Hoofdnavigatie" : "Main navigation"}
      >
        <div className="mx-auto flex max-w-6xl items-stretch justify-around px-1">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/learn"
                  ? pathname.startsWith("/learn")
                  : pathname.startsWith("/glossary") && item.href.includes("mode=");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-0.5 text-[10px] font-medium transition-colors min-w-0",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg transition-colors",
                    active && "bg-secondary",
                  )}
                >
                  <item.icon className="size-4" />
                </span>
                <span className="truncate max-w-full">{item.label[language]}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <footer className="border-t border-border/60 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px)+4rem)] md:pb-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-wrap items-center justify-center gap-2">
          <span>CISSP Leerplatform</span>
          <Badge variant="secondary" className="font-mono text-[10px]">
            400 terms
          </Badge>
          {ready && (
            <Badge variant="outline" className="font-mono text-[10px]">
              {knownCount}/400 {language === "nl" ? "geleerd" : "learned"}
            </Badge>
          )}
        </div>
      </footer>
    </div>
  );
}
