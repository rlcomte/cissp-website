# CISSP Learning Platform

Dit project bevat:

1. **Statische HTML-site** — originele leermaterialen per domein
2. **Next.js-app** (`cissp-app/`) — interactief leerplatform met 400 begrippen, zoekfunctie, flashcards en EN/NL-taalwissel

## Next.js-app (aanbevolen)

```bash
cd cissp-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Statische HTML-site

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```
