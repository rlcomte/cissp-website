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

Voor database-opslag van leer- en toetsvoortgang is een PostgreSQL-verbinding nodig:

```env
POSTGRES_URL=postgresql://user:password@host:5432/database
```

`DATABASE_URL` wordt ook ondersteund. De benodigde tabellen worden bij de eerste
API-aanroep automatisch aangemaakt. Wanneer een databasevariabele beschikbaar is,
voert `npm run build` eerst de migratie uit. Daardoor worden de tabellen ook
tijdens een Vercel-deployment aangemaakt.

De oefentoets staat op [http://localhost:3000/exams](http://localhost:3000/exams)
en bevat 40 vragen, vijf per CISSP-domein. Antwoorden worden na iedere keuze
opgeslagen en een open poging wordt na een refresh hervat.

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
