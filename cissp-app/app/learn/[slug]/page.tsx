import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { HtmlPageViewer } from "@/components/html-page-viewer";
import { LearnIndex } from "@/components/learn-index";
import { Badge } from "@/components/ui/badge";
import { getAllPages, getPageMeta } from "@/lib/pages";
import { getPageContent } from "@/lib/pages-server";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllPages().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const meta = getPageMeta(slug);
  if (!meta) return { title: "Not found" };
  return {
    title: `${meta.title} — CISSP`,
    description: meta.description,
  };
}

export default async function LearnPage({ params }: Props) {
  const { slug } = await params;
  const page = getPageContent(slug);
  if (!page) notFound();

  const related = getAllPages().filter(
    (p) => p.domainId === page.domainId && p.slug !== page.slug,
  );

  return (
    <AppShell>
      <div className="mb-6 space-y-4">
        <Link
          href="/learn"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
        >
          <ArrowLeft className="size-4" />
          Alle leerpagina&apos;s
        </Link>

        <div className="space-y-2">
          {page.eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {page.eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px] capitalize">
              {page.category}
            </Badge>
            {page.domainId && (
              <Badge variant="outline" className="font-mono text-[10px]">
                D{page.domainId}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.title}</h1>
          {page.description && (
            <p className="text-muted-foreground max-w-2xl">{page.description}</p>
          )}
        </div>

        {page.domainId && (
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href={`/domains/${page.domainId}`}
              className="text-xs rounded-lg border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              400 begrippen (D{page.domainId})
            </Link>
          </div>
        )}
      </div>

      <HtmlPageViewer page={page} />

      {related.length > 0 && (
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Gerelateerd
          </h2>
          <LearnIndex pages={related} compact />
        </div>
      )}
    </AppShell>
  );
}
