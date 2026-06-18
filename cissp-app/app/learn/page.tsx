import { AppShell } from "@/components/app-shell";
import { LearnIndex } from "@/components/learn-index";
import { getAllPages } from "@/lib/pages";

export const metadata = {
  title: "Leermateriaal — CISSP",
  description: "Alle domeinpagina's, casestudies en opdrachten uit het originele leermateriaal.",
};

export default function LearnOverviewPage() {
  const pages = getAllPages();

  return (
    <AppShell>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Leermateriaal</h1>
        <p className="text-muted-foreground max-w-xl">
          Alle {pages.length} originele HTML-leerpagina&apos;s — domeinintroducties, TrailBlaze
          casestudies en opdrachten — volledig leesbaar in de app.
        </p>
      </div>
      <LearnIndex pages={pages} />
    </AppShell>
  );
}
