import manifestData from "@/data/pages-manifest.json";
import type { Language } from "./types";

export type PageCategory = "domain" | "case" | "opdracht" | "overview" | "other";

export type PageMeta = {
  slug: string;
  file: string;
  category: PageCategory;
  domainId?: number;
  title: string;
  titleNl: string;
  description: string;
  eyebrow: string;
  nav: { href: string; label: string }[];
};

export type PageContent = PageMeta & {
  html: string;
  dialogs: string;
};

export const pagesManifest = manifestData as PageMeta[];

export function getAllPages() {
  return pagesManifest;
}

export function getPageMeta(slug: string) {
  return pagesManifest.find((p) => p.slug === slug);
}

export function getPagesByCategory(category: PageCategory) {
  return pagesManifest.filter((p) => p.category === category);
}

export function getDomainTeachingPage(domainId: number) {
  return pagesManifest.find((p) => p.category === "domain" && p.domainId === domainId);
}

export function getDomainCasePages(domainId: number) {
  return pagesManifest.filter((p) => p.category === "case" && p.domainId === domainId);
}

export function getPageTitle(page: PageMeta, lang: Language) {
  return lang === "nl" ? page.titleNl : page.title;
}
