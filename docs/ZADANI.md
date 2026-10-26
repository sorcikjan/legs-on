# LEGS:ON – web podcastu: zadání pro vývoj

Tento repozitář obsahuje podklady pro Claude Code (nebo vývojáře). Cílem je **funkční, klikací prototyp webu** podcastu LEGS:ON, který lze ukázat tvůrcům a později nasadit.

## 1. Kontext a cíle

LEGS:ON je český cyklistický podcast (Petr a Honza), 150+ dílů od března 2021. Dva formáty:
- **Rozhovor** – dlouhý rozhovor s hostem, číslování `#40`, zhruba 1× měsíčně.
- **Espresso** – týdenní přehled z pelotonu (každý čtvrtek), číslování `#093`.

Motto: **„Šlapej těma nohama“** (podpis Espressa: „Tak šlapej těma nohama a jedem!!!“).

Podcast je na Spotify, Apple Podcasts, YouTube, SoundCloud a Herohero, ale nemá vlastní web, který by fungoval jako domovská stránka. Cíle webu:
1. **Domovská stránka** – trvalé místo, kam lze odkazovat, ve vizuálu podcastu.
2. **Ukázat, že podcast žije** – díly jsou na homepage hodně vidět, s daty.
3. **SEO traffic** – každý díl, článek a host má vlastní indexovatelnou stránku. Články vznikají z přepisů dílů.
4. **Funnel k předplatnému:** Google → článek / host / díl → přehrát díl → **prodejní stránka /predplatne** → Herohero. Hlavní CTA „Předplatit“ vede VŽDY na `/predplatne`, nikdy rovnou na Herohero.
5. **Partneři** – stránka s media kitem a poptávkou.
6. **Minimální práce pro tvůrce** – díly se načítají automaticky z RSS.

## 2. Podklady v repozitáři

- `design/*.dc.html` – vizuální návrh každé stránky (viz mapování níže). Jde o HTML s inline styly; `{{proměnné}}` a `<sc-for>`/`<sc-if>` jsou šablonovací syntaxe návrhového nástroje a data jsou ve `<script>` na konci souboru (`renderVals()`). **Ber je jako přesnou vizuální předlohu** (barvy, písma, velikosti, rozestupy, pořadí sekcí, texty), ne jako kód k převzetí.
- `design/canvas.json` – přehled artboardů (název a velikost).
- `public/images/` – dočasné fotky (výřezy ze screenshotů, nízké rozlišení; nahradit originály).

| Soubor | Stránka | Route |
|---|---|---|
| Brand.dc.html | Homepage | `/` |
| Dily.dc.html | Archiv dílů | `/dily` |
| Dil.dc.html | Detail dílu (jedna šablona pro Rozhovor i Espresso) | `/dily/[slug]` např. `/dily/40-radim-korinek` |
| Clanky.dc.html | Výpis článků + filtr témat | `/clanky`, `/clanky/tema/[tema]` |
| Clanek.dc.html | Detail článku | `/clanky/[slug]` |
| Hoste.dc.html | Výpis hostů | `/hoste` |
| Host.dc.html | Profil hosta | `/hoste/[slug]` |
| ONas.dc.html | O nás | `/o-nas` |
| Predplatne.dc.html | Prodejní stránka předplatného | `/predplatne` |
| Partneri.dc.html | Pro partnery | `/pro-partnery` |
| HomeMobil / DilMobil / ClanekMobil | Mobilní verze (390 px) | – (responzivní) |

## 3. Doporučená technologie

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4** – už je založeno v tomto repozitáři. Pozor: přečti `AGENTS.md`, tahle verze Next.js má změny oproti starším; před psaním kódu si projdi dokumentaci v `node_modules/next/dist/docs/`.
- Stránky staticky generovat (Server Components, `generateStaticParams`, `generateMetadata`). Klientské komponenty (`"use client"`) jen pro přehrávač, filtry, mobilní menu a FAQ.
- Písma přes `next/font/google` (Anton, Poppins), obrázky přes `next/image`. Design tokeny z bodu 4 jako CSS proměnné / Tailwind `@theme` v `app/globals.css`.
- **Díly:** načítat z RSS feedu podcastu při buildu (title, datum, popis, délka, audio enclosure, obrázek), s revalidací. Typ dílu rozlišit z názvu (`ESPRESSO #93: …` vs `#40 LEGS:ON podcast - … | Host`). URL feedu: **[doplnit – feed hostovaný na SoundCloudu]**. Pro prototyp stačí lokální data (`data/episodes.ts`) s 8 díly z návrhu.
- **Články a hosté:** Markdown/MDX v repozitáři (`content/clanky`, `content/hoste`), později lze napojit headless CMS.
- Fotky jsou v `public/images/`.
- **Přepisy (fáze 2):** pipeline audio → přepis (např. Whisper) → návrh článku přes LLM → ruční schválení.
- **Nasazení:** Vercel nebo Netlify, doména legson.cz (ověřit stav stávající domény).

## 4. Design tokeny

Barvy:
- `--bg` #EEE7DA (krémová, hlavní pozadí)
- `--bg-light` #F7F3EB (světlé sekce: díly, články)
- `--bg-muted` #E3DCCF (tlumená šedá: O nás)
- `--ink` #121212 (text, tmavé sekce, patička)
- `--accent` #C8895B (karamel: CTA, štítek Rozhovor, hero)
- `--accent-light` #E0AC86 (zvýraznění na tmavém pozadí)
- `--muted` #4A4741 (sekundární text), `--line` #C9C1B2 (jemné linky), `--on-dark-muted` #CFC8BA / #A9A397

Písma (Google Fonts):
- **Anton** – logo, titulky sekcí, názvy dílů, verzálky, `line-height` 0.88–1.1.
- **Poppins** 400/500/600 – texty, popisky (verzálky s `letter-spacing` 1.5–2 px), **články celé v Poppins 500, běžná věta, bez verzálek**.

Pravidla: žádné zaoblené rohy kromě tlačítek a filtrů u článků (pill) a kulatých tlačítek přehrávání. Podcastové části jsou „tučné“ (Anton), článková část lehká a magazínová (Poppins). Kontrast textu minimálně 4.5:1. Touch targety minimálně 44 px.

## 5. Klíčové komponenty

- **Header:** logo, Díly / Články / Hosté / O nás, černé tlačítko „Předplatit“ → `/predplatne`. Na mobilu hamburger a viditelné „Předplatit“.
- **Řádek dílu:** datum · štítek (Rozhovor = karamelové pozadí, Espresso = orámovaný) · název (Anton) · délka · kulaté play.
- **Spotlight** na homepage: velká karta nejnovějšího dílu s fotkou a přechodem + menší karta nejnovějšího rozhovoru.
- **Přehrávač:** HTML5 audio z RSS enclosure, play/pauza, progress, čas; kapitoly klikatelné (seek). Na mobilu sticky mini-player dole.
- **CTA pás „Šlapej s námi.“** (tmavý) na konci každé stránky → `/predplatne`.
- **Článek:** přehrávač celého dílu pod perexem, CTA box „Tenhle článek vznikl díky předplatitelům“ uprostřed, odkaz na díl a hosta na konci, související články.

## 6. SEO požadavky

- `lang="cs"`, unikátní `<title>` a meta description pro každou stránku, canonical, Open Graph a Twitter karty (obrázek dílu/článku).
- Strukturovaná data JSON-LD: `PodcastSeries` (homepage), `PodcastEpisode` (detail dílu, s `associatedMedia`), `Article` (článek), `Person` (host, O nás), `BreadcrumbList`.
- Čitelné slugy bez diakritiky, `sitemap.xml`, `robots.txt`, odkaz na RSS v `<head>`.
- Přepis dílu je v HTML (indexovatelný), ne jen za tlačítkem načítaný JS.
- Interní prolinkování: díl ↔ host ↔ články, témata článků jako samostatné stránky.
- Výkon: statické generování, optimalizované obrázky (AVIF/WebP, `width`/`height`), lazy-load pod ohybem.

## 7. Měření funnelu

- Všechny odkazy na Herohero s UTM (`utm_source=legson.cz&utm_medium=web&utm_campaign=predplatne&utm_content=<umístění>`).
- Události: `play_episode`, `cta_predplatit_click` (s umístěním), `herohero_outbound`, `newsletter_signup`, `article_to_episode_click`.
- Analytika šetrná k soukromí (Plausible / Umami) nebo GA4 s cookie lištou.

## 8. Placeholdery k doplnění od tvůrců

Vše v hranatých závorkách v návrhu: cena a benefity předplatného, počet předplatitelů, fotky Petra a Honzy a jejich bio, příběh vzniku, e-mail/telefon, statistiky pro partnery (poslechy, dosah, completion rate), ceník spoluprací, loga partnerů, časy kapitol, role hostů, texty článků z přepisů, URL RSS feedu, odkazy na sociální sítě. Datum dílu #40 (20. 10. 2026) je odvozené – ověřit.

## 9. Akceptační kritéria prototypu

- Všechny stránky z tabulky existují, jsou propojené a odpovídají návrhu na 1440 px i 390 px.
- Homepage zobrazuje díly z dat (JSON/RSS), filtr v archivu a témata u článků fungují.
- Přehrávač hraje audio (pro prototyp lze použít libovolný testovací MP3).
- Každé „Předplatit“ vede na `/predplatne`; tam tlačítko vede na `https://herohero.co/legson` s UTM.
- Lighthouse: SEO ≥ 95, Accessibility ≥ 90, Performance ≥ 90 na mobilu.
