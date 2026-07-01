import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { GlossaryViewLoader } from "@/components/GlossaryView";
import { domains, getTermsByDomain } from "@/lib/glossary";
import {
  getDomainCasePages,
  getDomainTeachingPage,
  getPageTitle,
} from "@/lib/pages";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Briefcase } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return domains.map((d) => ({ id: String(d.id) }));
}

export default async function DomainPage({ params }: Props) {
  const { id } = await params;
  const domainId = Number(id);
  const domain = domains.find((d) => d.id === domainId);

  if (!domain) notFound();

  const terms = getTermsByDomain(domainId);
  const teachingPage = getDomainTeachingPage(domainId);
  const casePages = getDomainCasePages(domainId);

  return (
    <AppShell>
      <div className="mb-6 space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-2"
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>
        <div className="space-y-2">
          <Badge variant="secondary" className="font-mono">
            Domain {domain.id}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">{domain.nameNl}</h1>
          <p className="text-muted-foreground">{domain.name}</p>
        </div>
      </div>

      <GlossaryViewLoader domainFilter={domainId} />

      {(teachingPage || casePages.length > 0) && (
        <div className="mt-10 pt-8 border-t border-border space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Leermateriaal & cases
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {teachingPage && (
              <Link href={`/learn/${teachingPage.slug}`}>
                <Card className="h-full transition-colors hover:border-foreground/20">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="size-4 text-muted-foreground" />
                      <Badge variant="secondary" className="text-[10px]">Domeinpagina</Badge>
                    </div>
                    <CardTitle className="text-sm">{teachingPage.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {teachingPage.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
            {casePages.map((page) => (
              <Link key={page.slug} href={`/learn/${page.slug}`}>
                <Card className="h-full transition-colors hover:border-foreground/20">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="size-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-[10px]">Case</Badge>
                    </div>
                    <CardTitle className="text-sm">{getPageTitle(page, "nl")}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {page.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
