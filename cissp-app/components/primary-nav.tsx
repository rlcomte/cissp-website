"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, Layers, Search, Sparkles, Table2 } from "lucide-react";

const nav = [
  { href: "/", label: { en: "Home", nl: "Home" }, icon: BookOpen },
  { href: "/learn", label: { en: "Learn", nl: "Leren" }, icon: GraduationCap },
  { href: "/glossary?mode=search", label: { en: "Search", nl: "Zoeken" }, icon: Search },
  { href: "/glossary?mode=table", label: { en: "Table", nl: "Tabel" }, icon: Table2 },
  { href: "/glossary?mode=cards", label: { en: "Cards", nl: "Kaarten" }, icon: Layers },
  { href: "/glossary?mode=quiz", label: { en: "Quiz", nl: "Quiz" }, icon: Sparkles },
];

type Variant = "desktop" | "mobile";

function modeOf(href: string): string | null {
  const i = href.indexOf("mode=");
  return i === -1 ? null : href.slice(i + 5);
}

function NavMarkup({
  variant,
  isActive,
}: {
  variant: Variant;
  isActive: (href: string) => boolean;
}) {
  const { language } = useLanguage();

  if (variant === "desktop") {
    return (
      <nav className="hidden md:flex items-center gap-1">
        {nav.map((item) => {
          const active = isActive(item.href);
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
    );
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom,0px)]"
      aria-label={language === "nl" ? "Hoofdnavigatie" : "Main navigation"}
    >
      <div className="mx-auto flex max-w-6xl items-stretch justify-around px-1">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-0.5 text-[10px] font-medium transition-colors min-w-0",
                active ? "text-foreground" : "text-muted-foreground",
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
  );
}

/** Active-state aware nav — compares the real ?mode= param so only one glossary tab lights up. */
export function PrimaryNav({ variant }: { variant: Variant }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") ?? "search";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/learn") return pathname.startsWith("/learn");
    if (!pathname.startsWith("/glossary")) return false;
    return modeOf(href) === mode;
  };

  return <NavMarkup variant={variant} isActive={isActive} />;
}

/** Suspense fallback (and prerender): no search params yet, so highlight by path only. */
export function PrimaryNavFallback({ variant }: { variant: Variant }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/learn") return pathname.startsWith("/learn");
    // default glossary view is "search"
    if (!pathname.startsWith("/glossary")) return false;
    return modeOf(href) === "search";
  };

  return <NavMarkup variant={variant} isActive={isActive} />;
}
