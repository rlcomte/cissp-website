import type { Language } from "@/lib/types";

export const ui = {
  searchPlaceholder: { en: "Search terms, definitions, domains…", nl: "Zoek begrippen, definities, domeinen…" },
  filterTable: { en: "Filter table…", nl: "Filter tabel…" },
  allDomains: { en: "All domains", nl: "Alle domeinen" },
  results: { en: "results", nl: "resultaten" },
  of400: { en: "of 400 terms", nl: "van 400 begrippen" },
  noResults: { en: "No terms found.", nl: "Geen begrippen gevonden." },
  clear: { en: "Clear", nl: "Wissen" },
  shuffle: { en: "Shuffle", nl: "Schudden" },
  learned: { en: "learned", nl: "geleerd" },
  previous: { en: "Previous", nl: "Vorige" },
  next: { en: "Next", nl: "Volgende" },
  stillLearning: { en: "Still learning", nl: "Nog oefenen" },
  gotIt: { en: "Got it", nl: "Ken ik" },
  flipHint: { en: "Space to flip", nl: "Spatie om te draaien" },
  term: { en: "Term", nl: "Begrip" },
  definition: { en: "Definition", nl: "Definitie" },
  domain: { en: "Domain", nl: "Domein" },
  favorites: { en: "Favorites", nl: "Favorieten" },
  progress: { en: "Progress", nl: "Voortgang" },
  commandTitle: { en: "Search glossary", nl: "Zoek in begrippenlijst" },
  commandDesc: { en: "Jump to any of 400 CISSP terms instantly", nl: "Spring direct naar elk van de 400 CISSP-begrippen" },
  copy: { en: "Copied!", nl: "Gekopieerd!" },
  quiz: { en: "Quiz", nl: "Quiz" },
  quizQuestion: { en: "What does this term mean?", nl: "Wat betekent dit begrip?" },
  correct: { en: "Correct!", nl: "Goed!" },
  wrong: { en: "Wrong", nl: "Fout" },
  score: { en: "Score", nl: "Score" },
  showFavorites: { en: "Favorites only", nl: "Alleen favorieten" },
  showUnknown: { en: "Not learned yet", nl: "Nog niet geleerd" },
} as const;

export function t(key: keyof typeof ui, lang: Language) {
  return ui[key][lang];
}
