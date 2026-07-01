import fs from "fs";
import path from "path";
import type { PageContent } from "./pages";

const pagesDir = path.join(process.cwd(), "data", "pages");

export function getPageContent(slug: string): PageContent | null {
  const filePath = path.join(pagesDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as PageContent;
}
