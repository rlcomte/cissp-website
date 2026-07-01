export type Language = "en" | "nl";

export type GlossaryTerm = {
  id: number;
  domain: number;
  domainName: string;
  domainNameNl: string;
  term: string;
  definition: string;
  termNl: string;
  definitionNl: string;
};

export type DomainInfo = {
  id: number;
  name: string;
  nameNl: string;
  description: string;
  descriptionNl: string;
};
