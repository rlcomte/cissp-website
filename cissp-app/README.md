# CISSP Next.js Leerplatform

Next.js-app met alle **400 CISSP-begrippen** uit de originele HTML-site — vertaald naar het Nederlands, met snelle zoekfunctie, flashcards en een volledige tabel.

## Functies

- **Snel zoeken** — MiniSearch-index over begrippen, definities en domeinen (fuzzy + prefix)
- **Volledige tabel** — alle 400 begrippen, filter op domein
- **Flashcards** — omdraaikaarten om te leren, schudden, markeer als geleerd
- **Taalwissel** — EN ↔ NL voor begrippen én definities
- **8 domeinen** — per CISSP-domein apart oefenen

## Lokaal starten

```bash
cd cissp-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Productie-build

```bash
npm run build
npm start
```

## Data bijwerken

Begrippen worden geëxtraheerd uit de HTML-domeinpagina's in de projectroot:

```bash
# Vanuit projectroot
node scripts/extract-terms.mjs
```

Het bestand `cissp-app/data/glossary.json` bevat de volledige dataset met Nederlandse vertalingen.

## Structuur

```
cissp-app/
├── app/              # Next.js pagina's
├── components/       # UI-componenten
├── data/glossary.json # 400 begrippen EN + NL
└── lib/              # Zoekindex en helpers
```
