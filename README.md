# LEGS:ON – web podcastu

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4. Zadání: `docs/ZADANI.md`, návrhy: `design/`.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm run lint
```

## Obsah

- **Díly** – z RSS feedu (`PODCAST_RSS_URL`, výchozí je oficiální feed), při výpadku ze zálohy `data/feed.json` (`npm run snapshot`). Typ dílu se pozná z názvu, viz `lib/episodes.ts`. Fotky bez textu, kapitoly a přepisy v `data/episodes.ts`.
- **Články** – `content/clanky/*.md` (frontmatter + text; `## nadpis`, `> citace` + `> — autor`, `::prehravac`, `::predplatne`).
- **Hosté** – `content/hoste/*.md`.
- **Odkazy, kontakty, cena** – `lib/site.ts` (placeholdery k doplnění od tvůrců).

## Pravidla

- Každé „Předplatit“ vede na `/predplatne`; na Herohero se odchází jen odtud, vždy s UTM (`heroheroUrl()` v `lib/site.ts`).
- Události funnelu: `lib/analytics.ts` – posílají se do Plausible / Umami / GA4, pokud je na stránce načtený.
