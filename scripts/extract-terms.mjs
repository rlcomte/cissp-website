import fs from "fs";

const domains = [
  { id: 1, file: "cissp_domain_1_security_risk_management_page.html", name: "Security and Risk Management", nameNl: "Beveiliging en risicobeheer" },
  { id: 2, file: "cissp_domain_2_asset_security_page.html", name: "Asset Security", nameNl: "Beveiliging van assets" },
  { id: 3, file: "cissp_domain_3_security_architecture_engineering_page.html", name: "Security Architecture & Engineering", nameNl: "Beveiligingsarchitectuur en engineering" },
  { id: 4, file: "cissp_domain_4_network_security_page.html", name: "Communication & Network Security", nameNl: "Communicatie- en netwerkbeveiliging" },
  { id: 5, file: "cissp_domain_5_iam_page.html", name: "Identity & Access Management", nameNl: "Identiteits- en toegangsbeheer" },
  { id: 6, file: "cissp_domain_6_security_assessment_page.html", name: "Security Assessment & Testing", nameNl: "Beveiligingsbeoordeling en testen" },
  { id: 7, file: "cissp_domain_7_security_operations_page.html", name: "Security Operations", nameNl: "Beveiligingsoperaties" },
  { id: 8, file: "cissp_domain_8_software_security_page.html", name: "Software Development Security", nameNl: "Beveiliging bij softwareontwikkeling" },
];

const terms = [];

for (const d of domains) {
  const html = fs.readFileSync(d.file, "utf8");
  const glossaryMatch = html.match(/<section id="glossary"[\s\S]*?<table>([\s\S]*?)<\/table>/);
  if (!glossaryMatch) {
    console.error("No glossary in", d.file);
    continue;
  }
  const rows = glossaryMatch[1].matchAll(/<tr><td>(\d+)<\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><\/tr>/g);
  for (const m of rows) {
    terms.push({
      id: terms.length + 1,
      domain: d.id,
      domainName: d.name,
      domainNameNl: d.nameNl,
      term: m[2],
      definition: m[3],
    });
  }
}

console.log("Total terms:", terms.length);
fs.writeFileSync("extracted-terms.json", JSON.stringify(terms, null, 2));
