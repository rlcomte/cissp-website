import glossaryData from "@/data/glossary.json";
import type { DomainInfo, GlossaryTerm } from "./types";

export const glossary = glossaryData as GlossaryTerm[];

export const domains: DomainInfo[] = [
  {
    id: 1,
    name: "Security and Risk Management",
    nameNl: "Beveiliging en risicobeheer",
    description: "Governance, risk, compliance, and security principles.",
    descriptionNl: "Governance, risico, compliance en beveiligingsprincipes.",
  },
  {
    id: 2,
    name: "Asset Security",
    nameNl: "Beveiliging van assets",
    description: "Protection of data, devices, and information assets.",
    descriptionNl: "Bescherming van data, apparaten en informatie-assets.",
  },
  {
    id: 3,
    name: "Security Architecture & Engineering",
    nameNl: "Beveiligingsarchitectuur en engineering",
    description: "Secure design, models, and engineering controls.",
    descriptionNl: "Veilig ontwerp, modellen en technische beveiligingsmaatregelen.",
  },
  {
    id: 4,
    name: "Communication & Network Security",
    nameNl: "Communicatie- en netwerkbeveiliging",
    description: "Network architecture, protocols, and secure communication.",
    descriptionNl: "Netwerkarchitectuur, protocollen en veilige communicatie.",
  },
  {
    id: 5,
    name: "Identity & Access Management",
    nameNl: "Identiteits- en toegangsbeheer",
    description: "Authentication, authorization, and access control.",
    descriptionNl: "Authenticatie, autorisatie en toegangscontrole.",
  },
  {
    id: 6,
    name: "Security Assessment & Testing",
    nameNl: "Beveiligingsbeoordeling en testen",
    description: "Testing, auditing, and vulnerability assessment.",
    descriptionNl: "Testen, audit en kwetsbaarheidsbeoordeling.",
  },
  {
    id: 7,
    name: "Security Operations",
    nameNl: "Beveiligingsoperaties",
    description: "Monitoring, incident response, and SOC operations.",
    descriptionNl: "Monitoring, incident response en SOC-operaties.",
  },
  {
    id: 8,
    name: "Software Development Security",
    nameNl: "Beveiliging bij softwareontwikkeling",
    description: "Secure SDLC, coding, and application security.",
    descriptionNl: "Veilige SDLC, secure coding en applicatiebeveiliging.",
  },
];

export function getTermLabel(term: GlossaryTerm, lang: "en" | "nl") {
  return lang === "nl" ? term.termNl : term.term;
}

export function getTermDefinition(term: GlossaryTerm, lang: "en" | "nl") {
  return lang === "nl" ? term.definitionNl : term.definition;
}

export function getDomainLabel(term: GlossaryTerm, lang: "en" | "nl") {
  return lang === "nl" ? term.domainNameNl : term.domainName;
}

export function getTermsByDomain(domainId: number) {
  return glossary.filter((t) => t.domain === domainId);
}
