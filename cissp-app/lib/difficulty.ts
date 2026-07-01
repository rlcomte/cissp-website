import type { GlossaryTerm } from "@/lib/types";

/**
 * Per-term practice statistics gathered from quiz answers.
 * Stored client-side in progress and, eventually, the real signal that
 * overrides the heuristic estimate once enough attempts exist.
 */
export type TermStat = { seen: number; wrong: number };
export type TermStats = Record<number, TermStat>;

/**
 * How many observed attempts a term needs before the measured wrong-rate
 * fully outweighs the heuristic estimate. Below this the two are blended.
 */
const CONFIDENCE_K = 4;

/** Raw, un-normalised difficulty features derived purely from the term text. */
function rawFeatures(term: GlossaryTerm) {
  const en = term.term ?? "";
  const nl = term.termNl ?? "";
  const def = `${term.definition ?? ""} ${term.definitionNl ?? ""}`;

  // Acronyms / abbreviations (RAID, PKI, SAML, X.509…) are hard to recall.
  const acronym = /\b[A-Z0-9]{2,}(?:[./-][A-Z0-9]+)*\b/.test(en) ? 1 : 0;

  // Longer, multi-word terms are more complex to reproduce.
  const words = en.trim().split(/\s+/).filter(Boolean).length;

  // A dense/long definition signals a heavier concept.
  const defLength = def.trim().length;

  // Untranslated loan-word (NL == EN) is usually raw technical jargon.
  const loanword = nl.trim().toLowerCase() === en.trim().toLowerCase() ? 1 : 0;

  // Numbers, formulas or symbols point at calculations / standards.
  const technical = /[0-9]|×|%|\/|\bISO\b|\bNIST\b/.test(def) ? 1 : 0;

  return { acronym, words, defLength, loanword, technical };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/**
 * Build a stable, corpus-relative heuristic difficulty (0..1) for every term.
 * Features are min-max normalised across the whole glossary so the resulting
 * scores spread out nicely for ranking. Deterministic: same input → same map.
 */
export function buildHeuristicMap(terms: GlossaryTerm[]): Map<number, number> {
  const feats = terms.map((t) => ({ id: t.id, f: rawFeatures(t) }));

  const maxWords = Math.max(1, ...feats.map((x) => x.f.words));
  const maxDef = Math.max(1, ...feats.map((x) => x.f.defLength));

  const map = new Map<number, number>();
  for (const { id, f } of feats) {
    const score =
      0.3 * f.acronym +
      0.15 * f.loanword +
      0.15 * f.technical +
      0.2 * (f.words / maxWords) +
      0.2 * (f.defLength / maxDef);
    map.set(id, clamp01(score));
  }
  return map;
}

/**
 * Blend the heuristic estimate with observed quiz results. With no attempts the
 * heuristic stands alone; as attempts accumulate the measured wrong-rate takes
 * over (confidence = seen / (seen + K)).
 */
export function blendedDifficulty(heuristic: number, stat?: TermStat): number {
  if (!stat || stat.seen <= 0) return heuristic;
  const wrongRate = stat.wrong / stat.seen;
  const confidence = stat.seen / (stat.seen + CONFIDENCE_K);
  return clamp01(confidence * wrongRate + (1 - confidence) * heuristic);
}

export type RankedTerm = {
  term: GlossaryTerm;
  difficulty: number;
  heuristic: number;
  stat?: TermStat;
};

/**
 * Rank terms hardest-first using the blended score. Optionally filter by domain.
 */
export function rankByDifficulty(
  terms: GlossaryTerm[],
  stats: TermStats,
  domainFilter?: number,
): RankedTerm[] {
  const heuristics = buildHeuristicMap(terms);
  const pool = domainFilter
    ? terms.filter((t) => t.domain === domainFilter)
    : terms;

  return pool
    .map((term) => {
      const heuristic = heuristics.get(term.id) ?? 0;
      const stat = stats[term.id];
      return { term, heuristic, stat, difficulty: blendedDifficulty(heuristic, stat) };
    })
    .sort(
      (a, b) =>
        b.difficulty - a.difficulty ||
        (b.stat?.seen ?? 0) - (a.stat?.seen ?? 0) ||
        a.term.id - b.term.id,
    );
}
