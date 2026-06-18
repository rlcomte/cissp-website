"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useLanguage } from "@/components/LanguageProvider";
import { getTermDefinition, getTermLabel } from "@/lib/glossary";
import { getAllPages as getLearnPages, getPageTitle as getLearnPageTitle } from "@/lib/pages";
import { searchGlossary } from "@/lib/search";
import { t } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Layers,
  Search,
  Sparkles,
  Table2,
} from "lucide-react";

type CommandMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandMenuContext = createContext<CommandMenuContextValue | null>(null);

export function useCommandMenu() {
  const ctx = useContext(CommandMenuContext);
  if (!ctx) throw new Error("useCommandMenu must be used within CommandMenuProvider");
  return ctx;
}

export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const results = query.trim() ? searchGlossary(query).slice(0, 12) : [];
  const pageResults = query.trim()
    ? getLearnPages()
        .filter((p) => {
          const q = query.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.titleNl.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
          );
        })
        .slice(0, 6)
    : [];

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      router.push(path);
    },
    [router],
  );

  return (
    <CommandMenuContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("commandTitle", language)}
        description={t("commandDesc", language)}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("searchPlaceholder", language)}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
          <CommandEmpty>{t("noResults", language)}</CommandEmpty>

          {!query && (
            <>
              <CommandGroup heading={language === "nl" ? "Navigatie" : "Navigation"}>
                <CommandItem onSelect={() => navigate("/")}>
                  <BookOpen />
                  Home
                </CommandItem>
                <CommandItem onSelect={() => navigate("/learn")}>
                  <BookOpen />
                  {language === "nl" ? "Leermateriaal" : "Learning material"}
                </CommandItem>
                <CommandItem onSelect={() => navigate("/glossary?mode=search")}>
                  <Search />
                  {language === "nl" ? "Snel zoeken" : "Fast search"}
                </CommandItem>
                <CommandItem onSelect={() => navigate("/glossary?mode=table")}>
                  <Table2 />
                  {language === "nl" ? "Tabel" : "Table"}
                </CommandItem>
                <CommandItem onSelect={() => navigate("/glossary?mode=cards")}>
                  <Layers />
                  Flashcards
                </CommandItem>
                <CommandItem onSelect={() => navigate("/glossary?mode=quiz")}>
                  <Sparkles />
                  Quiz
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={language === "nl" ? "Domeinen" : "Domains"}>
                {Array.from({ length: 8 }, (_, i) => i + 1).map((id) => (
                  <CommandItem key={id} onSelect={() => navigate(`/domains/${id}`)}>
                    <Badge variant="secondary" className="font-mono text-xs">
                      D{id}
                    </Badge>
                    {language === "nl" ? `Domein ${id}` : `Domain ${id}`}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {query && pageResults.length > 0 && (
            <CommandGroup heading={language === "nl" ? "Leerpagina's" : "Learning pages"}>
              {pageResults.map((page) => (
                <CommandItem
                  key={page.slug}
                  value={`${page.title} ${page.titleNl}`}
                  onSelect={() => navigate(`/learn/${page.slug}`)}
                >
                  <BookOpen className="size-3.5" />
                  <span className="font-medium">{getLearnPageTitle(page, language)}</span>
                  {page.domainId && (
                    <Badge variant="secondary" className="ml-auto font-mono text-[10px]">
                      D{page.domainId}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {query && results.length > 0 && (
            <CommandGroup heading={language === "nl" ? "Begrippen" : "Terms"}>
              {results.map((term) => (
                <CommandItem
                  key={term.id}
                  value={`${term.term} ${term.termNl} ${term.id}`}
                  onSelect={() => navigate(`/glossary?mode=search&q=${term.id}`)}
                >
                  <span className="font-mono text-xs text-muted-foreground">#{term.id}</span>
                  <span className="font-medium">{getTermLabel(term, language)}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground max-w-[200px]">
                    {getTermDefinition(term, language).slice(0, 60)}…
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {query && (
            <CommandGroup>
              <CommandItem onSelect={() => navigate(`/glossary?mode=search&q=${encodeURIComponent(query)}`)}>
                <Search />
                {language === "nl" ? `Zoek “${query}”` : `Search “${query}”`}
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
        </Command>
      </CommandDialog>
    </CommandMenuContext.Provider>
  );
}

export function CommandTrigger() {
  const { setOpen } = useCommandMenu();
  const { language } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Search className="size-3.5" />
      <span>{language === "nl" ? "Zoeken…" : "Search…"}</span>
      <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        ⌘K
      </kbd>
    </button>
  );
}
