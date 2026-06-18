import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { GlossaryViewLoader } from "@/components/GlossaryView";
import { domains, getTermsByDomain } from "@/lib/glossary";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

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
          <p className="text-sm text-muted-foreground font-mono">{terms.length} terms</p>
        </div>
      </div>
      <GlossaryViewLoader domainFilter={domainId} />
    </AppShell>
  );
}
