import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { translations } from "./glossary-translations.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = JSON.parse(readFileSync(join(root, "extracted-terms.json"), "utf8"));
const outDir = join(root, "cissp-app", "data");
mkdirSync(outDir, { recursive: true });

const glossary = source.map((item) => {
  const nl = translations[item.id];
  if (!nl) throw new Error(`Missing Dutch translation for id ${item.id}`);
  return {
    id: item.id,
    domain: item.domain,
    domainName: item.domainName,
    domainNameNl: item.domainNameNl,
    term: item.term,
    definition: item.definition,
    termNl: nl.termNl,
    definitionNl: nl.definitionNl,
  };
});

if (glossary.length !== 400) throw new Error(`Expected 400 items, got ${glossary.length}`);

const outPath = join(outDir, "glossary.json");
writeFileSync(outPath, JSON.stringify(glossary, null, 2) + "\n", "utf8");
console.log(`Written ${glossary.length} items to ${outPath}`);
