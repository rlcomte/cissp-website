import MiniSearch from "minisearch";
import { glossary } from "./glossary";
import type { GlossaryTerm } from "./types";

let searchIndex: MiniSearch<GlossaryTerm> | null = null;

export function getSearchIndex() {
  if (searchIndex) return searchIndex;

  searchIndex = new MiniSearch<GlossaryTerm>({
    fields: ["term", "termNl", "definition", "definitionNl", "domainName", "domainNameNl"],
    storeFields: [
      "id",
      "domain",
      "domainName",
      "domainNameNl",
      "term",
      "definition",
      "termNl",
      "definitionNl",
    ],
    searchOptions: {
      boost: { term: 3, termNl: 3, domainName: 1, domainNameNl: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  searchIndex.addAll(glossary);
  return searchIndex;
}

// Pre-warm index at module load for instant first search
if (typeof window !== "undefined") {
  queueMicrotask(() => getSearchIndex());
} else {
  getSearchIndex();
}

export function searchGlossary(query: string, domainFilter?: number): GlossaryTerm[] {
  const trimmed = query.trim();
  const index = getSearchIndex();

  if (!trimmed) {
    const all = domainFilter
      ? glossary.filter((t) => t.domain === domainFilter)
      : glossary;
    return all;
  }

  const results = index.search(trimmed);
  const terms = results.map((r) => r as unknown as GlossaryTerm);

  if (domainFilter) {
    return terms.filter((t) => t.domain === domainFilter);
  }

  return terms;
}
