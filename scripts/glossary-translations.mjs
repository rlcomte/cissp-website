import { part1 } from "./glossary-translations-1.mjs";
import { part2 } from "./glossary-translations-2.mjs";
import { part3 } from "./glossary-translations-3.mjs";
import { part4 } from "./glossary-translations-4.mjs";

export const translations = { ...part1, ...part2, ...part3, ...part4 };

if (Object.keys(translations).length !== 400) {
  throw new Error(`Expected 400 translations, got ${Object.keys(translations).length}`);
}
