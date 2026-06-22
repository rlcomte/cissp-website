import { AppShell } from "@/components/app-shell";
import { LearnIndex } from "@/components/learn-index";
import { getAllPages } from "@/lib/pages";

export const metadata = {
  title: "Theorie & scenario's · CISSP",
  description: "Domeintheorie, TrailBlaze-scenario's en opdrachten, los van de begrippen.",
};

export default function LearnOverviewPage() {
  const pages = getAllPages();

  return (
    <AppShell>
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Theorie &amp; scenario&apos;s</h1>
        <p className="text-muted-foreground max-w-xl">
          De {pages.length} leerpagina&apos;s achter de begrippen: domeintheorie, TrailBlaze-scenario&apos;s
          en opdrachten. De losse begrippen vind je onder Zoeken, Tabel, Kaarten en Quiz.
        </p>
      </div>
      <LearnIndex pages={pages} />
    </AppShell>
  );
}
