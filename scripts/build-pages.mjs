import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.resolve(import.meta.dirname, "../cissp-app/data/pages");
const MANIFEST = path.resolve(import.meta.dirname, "../cissp-app/data/pages-manifest.json");

const SKIP = new Set(["index.html", "cissp_homepage.html"]);

const DOMAIN_MAP = {
  cissp_domain_1_security_risk_management_page: 1,
  cissp_domain_2_asset_security_page: 2,
  cissp_domain_3_security_architecture_engineering_page: 3,
  cissp_domain_4_network_security_page: 4,
  cissp_domain_5_iam_page: 5,
  cissp_domain_6_security_assessment_page: 6,
  cissp_domain_7_security_operations_page: 7,
  cissp_domain_8_software_security_page: 8,
};

function slugFromFile(file) {
  return file.replace(/\.html$/, "");
}

function extractTag(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function extractMeta(html) {
  const title = extractTag(html, "title") || "Untitled";
  const eyebrow = html.match(/class="eyebrow"[^>]*>([^<]+)/)?.[1]?.trim() || "";
  const h1 = html.match(/<header[\s\S]*?<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim();
  const subtitle = html.match(/<header[\s\S]*?<p class="subtitle"[^>]*>([^<]+)/i)?.[1]?.trim()
    || html.match(/<header[\s\S]*?<p class="subtitle"[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();

  return { title, eyebrow, h1, subtitle };
}

function extractNav(html) {
  const navBlock = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i)?.[1] || "";
  const links = [...navBlock.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi)];
  return links
    .filter(([, href]) => href.startsWith("#"))
    .map(([, href, label]) => ({ href, label: label.trim() }));
}

function extractMain(html) {
  return html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1]?.trim() || "";
}

function extractDialogs(html) {
  return [...html.matchAll(/<dialog[\s\S]*?<\/dialog>/gi)].map((m) => m[0]).join("\n");
}

function rewriteContent(html) {
  return html
    .replace(/href="index\.html"/gi, 'href="/"')
    .replace(/href="cissp_homepage\.html"/gi, 'href="/"')
    .replace(/href="([^"#]+\.html)(#[^"]*)?"/gi, (_, file, hash = "") => {
      const slug = slugFromFile(file);
      return `href="/learn/${slug}${hash || ""}"`;
    })
    .replace(/src="images\//g, 'src="/images/');
}

function categorize(slug) {
  if (slug.startsWith("cissp_domain_")) return "domain";
  if (slug.includes("opdracht")) return "opdracht";
  if (slug === "trailblaze_adventures_case_security_swot") return "overview";
  if (slug.startsWith("trailblaze_")) return "case";
  return "other";
}

function titleNl(meta, category, domainId) {
  if (domainId && category === "domain") {
    const names = {
      1: "Beveiliging en risicobeheer",
      2: "Beveiliging van assets",
      3: "Beveiligingsarchitectuur en engineering",
      4: "Communicatie- en netwerkbeveiliging",
      5: "Identiteits- en toegangsbeheer",
      6: "Beveiligingsbeoordeling en testen",
      7: "Beveiligingsoperaties",
      8: "Beveiliging bij softwareontwikkeling",
    };
    return `Domein ${domainId} — ${names[domainId]}`;
  }
  if (category === "case" && domainId) return `TrailBlaze case — Domein ${domainId}`;
  if (category === "overview") return "TrailBlaze — Security SWOT";
  if (category === "opdracht") return meta.h1 || meta.title;
  return meta.h1 || meta.title;
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const htmlFiles = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith(".html") && !SKIP.has(f));

const manifest = [];

for (const file of htmlFiles.sort()) {
  const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
  const slug = slugFromFile(file);
  const meta = extractMeta(raw);
  const category = categorize(slug);
  const domainId = DOMAIN_MAP[slug] ?? guessDomainId(slug);

  const main = rewriteContent(extractMain(raw));
  const dialogs = rewriteContent(extractDialogs(raw));
  const nav = extractNav(raw);

  const page = {
    slug,
    file,
    category,
    domainId,
    title: meta.h1 || meta.title,
    titleNl: titleNl(meta, category, domainId),
    description: meta.subtitle || "",
    eyebrow: meta.eyebrow || "",
    nav,
    html: main,
    dialogs,
  };

  fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(page));
  manifest.push({
    slug,
    file,
    category,
    domainId,
    title: page.title,
    titleNl: page.titleNl,
    description: page.description,
    eyebrow: page.eyebrow,
    nav: page.nav,
  });
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
console.log(`Built ${manifest.length} pages → ${OUT}`);

function guessDomainId(slug) {
  const m = slug.match(/domain[_-](\d)/i);
  return m ? Number(m[1]) : undefined;
}
