# Prováděcí plán: vánoční release

Stav 27. 11. 2026. Den D navržen na pátek **18. 12.**, uzávěrka textů 16. 12. Technické podklady: `SPIKE-CLOUDFLARE.md` (datový model, vzor stránek nad D1, Access, URL mapa).

**Hotovo:** web běží na Cloudflare (testovací prostředí na Janově účtu, `legs-on.sorcikjan.workers.dev`, bez hesla, noindex), D1 s migracemi 0001–0002, nasazení pushem na `main`.

## Pořadí a termíny

Každý krok končí nasazením na testovací adresu a ověřením. Pořadí je dané závislostmi: bez dat v D1 není co spravovat, bez administrace není kam synchronizovat.

### 1. Obsah v databázi (27. 11. – 1. 12.)
**Stav 27. 11.: hotovo**, kromě kroku po nasazení v dashboardu. Na testovací adrese běží z D1 158 dílů, 38 hostů, 20 článků. Sitemap i texty stránek se shodují s verzí ze souborů, `slugMismatches` je prázdné. Vypuštěné jen zástupné texty prototypu (vymyšlený přepis u #40, ukázkové bio). CPU (wrangler tail): stránka z cache 5–22 ms, vykreslení 26–173 ms (`/dily`). Free limit 10 ms nestačí, produkce potřebuje Workers Paid (je v doporučené variantě kalkulace).

- Importní skript (`scripts/import-d1.mjs`, idempotentní): 157 dílů z RSS do `episodes`, 38 hostů z `content/hoste` do `people` + vazby `episode_people`, 20 článků z `content/clanky` do `articles` (`source='import'`, schválené) + štítky a vazby.
- Test podmínky spuštění: slugy všech dílů v D1 = slugy z dnešního `lib/episodes.ts`.
- Veřejné stránky čtou z D1 (datová vrstva v `lib/`, vzor ze spiku: `generateStaticParams` → `[]`, seznamy `revalidate = 900`). Markdown a `content.generated.json` po přepnutí odpadnou.
- `POST /api/revalidate` + krok po nasazení (Workers Builds deploy command rozšířit o volání).
- Měření CPU času na `/dily` a `/sitemap.xml` (Workers Logs). Pokud přes 10 ms → Workers Paid (je v kalkulaci).
- **Hotovo když:** web na testovací adrese vypadá stejně jako dnes, ale data jdou z D1; test slugů zelený.

### 2. Administrace (2. – 8. 12.)
- Cloudflare Access na Janově účtu (kroky 6–9 ve spiku): `/admin*`, přihlášení e-mailovým kódem pro Jana, Petra, Honzu. Celý web zůstává bez přihlášení (testovací prostředí, noindex).
- `/admin` má čtyři sekce: **Díly, Články, Hosté, Fotky**. Úvod: co čeká na schválení.
- Článek: úprava (titulek, perex, text, téma, hosté, díl), uložit koncept / schválit a zveřejnit / naplánovat / stáhnout. Každé uložení = revize + audit + revalidace dotčených stránek. Změna slugu zveřejněného článku zapíše přesměrování.
- Díl: doplnění hostů, kapitol, fotky bez textu; ruční skrytí.
- Hosté: profil (jméno, tvary jména, role, bio, fotka, odkazy pro JSON-LD), stav koncept / zveřejněný. Seznam dílů a článků na `/hoste/[slug]` se skládá z vazeb, ručně se nevyplňuje.
- Fotky: jedna knihovna v R2 (`legson-media`), nahrání s popiskem, autorem a licencí, výběr k dílu, hostovi i článku. Výřezy (mobil, Discover, OG) za běhu podle bodu zájmu.
- Video: jen vložené (YouTube, Instagram) jako blok v textu článku nebo dílu. Vlastní hosting videa ne (mimo kalkulaci).
- Vzhled: jednoduchý funkční seznam a formuláře v barvách a písmech webu, bez návrhu od Designera. **Čeká na Janovo ano.**
- **Hotovo když:** Petr může přihlásit, upravit a zveřejnit článek a změna je na webu hned.

### 3. Automatické načítání dílů (do 9. 12.)
- GitHub Action denně ráno + ručně: nový díl z RSS → `episodes` jako zveřejněný, k němu prázdný koncept článku propojený s dílem → revalidace.
- Neznámý host z názvu dílu → koncept v `people` připojený k dílu; tvůrci doplní fotku a bio a zveřejní.
- Token jen D1 Edit na tento účet, uložený v GitHub secrets.
- **Hotovo když:** nový díl se na webu objeví do druhého dne bez zásahu a v administraci čeká koncept.

### 4. Newsletter (7. – 11. 12.)
- Přihlášení na webu (formulář → API Ecomailu ze Server Action, dvojité potvrzení v Ecomailu), stránka `/newsletter`, `/ochrana-osobnich-udaju`.
- Import stávajících odběratelů do Ecomailu (ruční, Jan).
- Rozesílání vydání: v Ecomailu ručně. Archiv vydání na webu až po releasu.
- **Blokuje:** kde jsou dnes odběratelé a kolik jich je, provozovatel webu (GDPR), DNS domény pro SPF/DKIM.

### 5. Koncept článku z dílu (10. – 15. 12., jen pokud 1–4 stihneme)
- Do Action z kroku 3: přepis (OpenAI) → návrh článku (Claude) → koncept v administraci. Publikuje vždy člověk.
- **Blokuje:** karta tvůrců (náklady API, přepis archivu ~1 900 Kč). Když nestihneme, jde jako první věc po releasu a v releasu je koncept prázdný (krok 3).

### 6. Spuštění (12. – 18. 12.)
- Tester: všechny stránky, funnel na `/predplatne`, mobil 390 px, Lighthouse, JSON-LD.
- Přesun na účet tvůrců (nový setup + export/import D1, odhad hodina) a doména `legson.cz`, ideálně do 14. 12., aby zbyl čas na kontrolu.
- Produkce s předstihem před dnem D: `SITE_PUBLIC=true` při buildu, kontrola robots a sitemap, odeslat sitemap do Search Console, ať Google indexuje postupně.
- Den D: komunikace (sítě, newsletter).

## Co potřebujeme od tvůrců a do kdy
| Do | Co | Pro krok |
|---|---|---|
| 30. 11. | karta | 5, 6 (Paid, API, účty) |
| 3. 12. | kde jsou odběratelé newsletteru, provozovatel webu | 4 |
| 3. 12. | přístup k DNS `legson.cz`, společný e-mail na účty | 4, 6 |
| 10. 12. | potvrzený den D | 6 |

## Mimo release (zapsáno, nestaví se)
E-shop (tabulky v `migrations-later/`), archiv newsletteru na webu, stránky autorů, vyhledávání, eventy, Cron pro plánované publikování (do té doby se naplánovaný článek objeví do 15 minut díky revalidaci seznamů).
