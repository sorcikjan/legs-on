# Spike: Cloudflare Workers + OpenNext + D1 + Access

Datum: 2026-11-26. Větev: `worktree-agent-a9e72bf3a0b45858f`. Vše ověřeno lokálně (workerd přes `opennextjs-cloudflare preview`), na Cloudflare účet přístup nebyl.

## Verdikt

**GO s podmínkami:** web jde provozovat na Cloudflare Workers přes OpenNext (včetně D1, okamžitého publikování a ověření Access JWT), ale jen na Next.js **16.4.6** a **po vypnutí `cacheComponents`**, které se v workerd runtime nespustí (každý požadavek skončí 500). Rozpočet drží, pokud Free tarif stačí na CPU limit 10 ms (neověřeno, viz rizika); rezerva Paid 5 USD/měsíc je reálně nutná jako plán B.

## Co jsem ověřil a jak

| # | Co | Příkaz / postup | Výsledek |
|---|---|---|---|
| 1 | OpenNext podporuje Next 16.4.3? | `npm i @opennextjs/cloudflare@1.20.19 wrangler` při `next@16.4.3` | **Ne.** `ERESOLVE ... peer next@">=15.5.29 <16 \|\| >=16.4.5" from @opennextjs/cloudflare@1.20.19` |
| 2 | S 16.4.6 | `npm i next@16.4.6 eslint-config-next@16.4.6 @opennextjs/cloudflare@1.20.19 wrangler@^4.148.0` | Instalace i `opennextjs-cloudflare build` projdou. `npm audit` hlásí 7 moderate, žádné high/critical |
| 3 | Build s `cacheComponents: true` | `opennextjs-cloudflare build` + `preview` | Build projde s varováním „Cache Components are not fully supported on Cloudflare yet" (PR opennextjs-cloudflare #1318). **Za běhu všechny stránky 500**, i čistě statické `/pro-partnery`. Logy: `Error: This promise was created by a request that has since ended` (compat date 2026-11), po vyzkoušení `compatibility_date 2025-06-01` i `no_handle_cross_request_promise_resolution` už jen `The Workers runtime canceled this request because it detected that your Worker's code had hung` a `Next.js cannot guarantee that Cache Components will run as expected due to ... setTimeout()` |
| 4 | Čtení `content/*.md` za běhu | první preview | **500:** `Error: no such file or directory, readdir '/bundle/content/clanky'`. Workers nemají souborový systém. Oprava: `scripts/gen-content.mjs` vloží markdown do `data/content.generated.json` (spouští `predev`/`prebuild`), `lib/content.ts` čte z něj |
| 5 | Bez `cacheComponents` (vypnuto, `"use cache"/cacheLife` nahrazeno `fetch(..., {next:{revalidate:86400}})`) | `opennextjs-cloudflare build && preview`, `curl -u x:tajne` na všechny routy | 200: `/`, `/dily`, `/dily/espresso-097`, `/dily/42-radovan-stastny`, `/clanky`, `/clanky/<slug>`, `/clanky/tema/silnice`, `/hoste`, `/hoste/zdenek-stybar`, `/o-nas`, `/predplatne`, `/pro-partnery`, `/robots.txt`, `/sitemap.xml` (26 kB); 404 pro neexistující stránku i slug. Odezvy lokálně 7-20 ms |
| 6 | proxy.ts | `curl` bez hesla / se špatným / se správným | 401 / 401 / 200, `x-robots-tag: noindex, nofollow` funguje. OpenNext ale píše „Node.js middleware support is experimental ... not officially maintained". Doporučení: proxy.ts nahradit Access (kap. Access) |
| 7 | next/image | `/_next/image?url=%2Fimages%2Fespresso-097.jpg&w=640&q=75` | 200, `image/webp` (přes binding `IMAGES`). Obálky z RSS (cloudfront) jdou přes `<img>` bez optimalizace, nezkoušeno |
| 8 | SEO výstup | `curl` | JSON-LD na dílu přítomen, canonical `https://legson.cz/dily/espresso-097` |
| 9 | Záloha RSS | `PODCAST_RSS_URL=http://127.0.0.1:1/x next build` | Log `Načtení RSS selhalo, používám data/feed.json`, build pokračuje. Živý feed z anchor.fm vrací 200, ve výstupu 157 dílů (shodně s `feed.json`) |
| 10 | D1 lokálně | `wrangler d1 migrations apply DB --local`; Server Component čte `env.DB` přes `getCloudflareContext({async:true})`, route handler `POST /api/spike` zapisuje | Funguje. Pozor: `next build` při prerenderu volá D1 také (lokální) – viz riziko 2 |
| 11 | Okamžité publikování | skript: GET (HIT) → POST zápis + `revalidatePath` → GET → GET | `x-nextjs-cache: HIT` s 2 řádky → po zápisu **MISS** s novým řádkem (nový čas renderu) → HIT. Změna je vidět na první následující návštěvě. Konfigurace: R2 incremental cache + D1 tag cache + memory queue |
| 12 | Schéma | `migrations/0001_obsah.sql` (původní verze, později přepsána, viz Datový model na rok) aplikováno do odděleného lokálního D1 | Prošlo. CHECK `status != 'published' OR published_at IS NOT NULL` odmítl neplatný zápis (`SQLITE_CONSTRAINT_CHECK`); join článek→díl vrací očekávaný řádek; měkké smazání filtrováno `deleted_at IS NULL` |
| 13 | Ověření Access JWT | `npm run test:access` (vlastní RSA klíč + falešný JWKS) | 9/9: platný token projde; prošlý, cizí AUD, cizí issuer, cizí klíč, neznámé `kid`, `alg: none`, chybějící token i chybějící konfigurace jsou odmítnuty |
| 14 | `tsc --noEmit`, `next build` | | Čisté |

## Co jsem neověřil a proč

| Co | Proč |
|---|---|
| Nasazení na skutečný Cloudflare, vzdálené D1/R2, custom doména | Bez přístupu k účtu |
| CPU čas na požadavek (Free limit 10 ms) | workerd lokálně CPU čas nereportuje; měří se až po nasazení (Workers Logs, `cpuTime`). Největší neznámé: stránka `/dily` (350 kB HTML), `/sitemap.xml` |
| Cloudflare Access (celá kap. 5) | Nelze bez účtu; ověřena jen moje validace JWT na syntetických tokenech |
| Limit uživatelů Zero Trust Free | V dokumentaci Cloudflare jsem číslo nenašel (z paměti 50 uživatelů, **neověřeno**). Pro nás stačí 2-3 lidé. Dokumentace potvrzuje, že i Free plán při zakládání vyžaduje platební kartu |
| Zda R2 vyžaduje kartu k aktivaci | Dokumentace uvádí free tier (10 GB, 1 M Class A, 10 M Class B ops/měsíc); nutnost karty jsem neověřil |
| GitHub Actions → D1 | Jen návrh (kap. Automatizace); nezkoušeno |
| Zákulisí SITE_PUBLIC | `robots.ts` a `sitemap` jsou prerenderované: `SITE_PUBLIC=true` musí být nastaveno **při buildu**, ne jen jako runtime proměnná |
| Lighthouse na workerd | Neměřeno |

## Velikost workeru proti limitu Free

Měřeno `wrangler deploy --dry-run --outdir`: `worker.js` **7 325 901 B (6,99 MiB)**, gzip `wrangler` hlásí **1 473 KiB (1,44 MiB)**. Statické soubory (39 souborů, 1,6 MB) jdou přes Workers Static Assets zvlášť.

Limit podle `developers.cloudflare.com/workers/platform/limits` (staženo 2026-11-26): **64 MiB nekomprimovaně, na Free i Paid, komprimovaný limit neexistuje**. Zabíráme ~11 %. I starý limit 3 MB gzip bychom splnili. Velikost tedy rozpočet neohrožuje. (Cache `.open-next/cache`, 27 MB, se nahrává do R2, ne do workeru.)

## Cloudflare služby a cena

| Služba | K čemu | Free limit (dle dokumentace) | Cena |
|---|---|---|---|
| Workers + Static Assets | web | 100 000 požadavků/den, **10 ms CPU/požadavek**, 64 MiB | 0; Paid 5 USD/měs. (~60 USD/rok, ~1 400 Kč při kurzu ~23 Kč/USD, orientačně) |
| D1 | díly, články, tag cache | 5 M čtení/den, 100 000 zápisů/den, 10 DB | 0 |
| R2 | incremental cache OpenNext | 10 GB, 1 M Class A, 10 M Class B ops/měs. | 0 (cache má 27 MB) |
| Images binding | next/image | 5 000 unikátních transformací/měs., po překročení chyba 9422, nikdy se neúčtuje na Free | 0 |
| Zero Trust Access | admin + zámek webu | Free plán (limit uživatelů neověřen) | 0 |
| Cron Triggers | volitelné | 5 na účet | 0 |
| Durable Objects / KV / Queues | **nepotřebujeme** | | 0 |

Proti kalkulaci 4 100 Kč/rok: na Free se do ní vejdeme beze změny (hosting 0). Na Paid přibude ~1 400 Kč/rok; zda se do 4 100 Kč vejde, závisí na ostatních položkách kalkulace (doména, newsletter, Herohero apod.), které jsem neviděl. **Další placená služba není v návrhu potřeba.** KV jsem vyloučil záměrně: je eventuálně konzistentní (okamžité publikování by nebylo zaručené) a má limit 1 000 zápisů/den.

## Doporučení k verzi Next.js

Stavět na **16.4.6**. 16.4.3 OpenNext 1.20.19 odmítne (peer `>=16.4.5`), takže upgrade je podmínka, ne volba. Zároveň to řeší známou zranitelnost. Dopad na kód: vypnout `cacheComponents` a `partialPrefetching` (`next.config.ts`), `"use cache"` v `lib/episodes.ts` nahradit `fetch` s `next.revalidate` (tag `rss`) – hotovo v této větvi. Sledovat opennextjs-cloudflare #1318; návrat ke Cache Components až po jeho dokončení, ne před 18. 12.

## Datový model a architektura administrace

Schéma: `migrations/0001_obsah.sql` (díly, články, lidé, štítky, fotky, přesměrování, audit), `0002_newsletter.sql`, `0003_eshop.sql` (wrangler d1 migrations; spike tabulka je pryč). Podrobnosti a zdůvodnění níže v „Datový model na rok".

Architektura: veřejné stránky jsou ISR (R2 cache), čtou D1; admin (`/admin`, Server Actions) zapisuje do D1, zapíše `audit_log` a zavolá `revalidatePath`. Tag cache a obsah sdílejí jednu D1 databázi `legson` (dva bindingy, `NEXT_TAG_CACHE_D1` a `DB`); tabulku `revalidations` vytvoří `opennextjs-cloudflare populateCache` samo.

## Vzor stránek závislých na D1 (rozhodnutí pro psaní administrace)

**Doporučení: ISR na vyžádání. Build D1 nečte, po každém nasazení se vše revaliduje, časová revalidace slouží jako záchranná síť.**

1. `lib/db.ts` (`getDb()`) vrací při `next build` `null`; datová vrstva pak vrací prázdný výsledek. Build tedy nespadne na chybějících tabulkách a nezapeče cizí data. Ověřeno: build s úplně smazaným `.wrangler/state` projde.
2. Detailní stránky (`/dily/[slug]`, `/clanky/[slug]`, `/hoste/[slug]` ...): `generateStaticParams` vrací `[]`, `dynamicParams` zůstává zapnuté. Stránka se vyrenderuje při první návštěvě, uloží do R2 a drží do `revalidatePath`.
3. Seznamy, homepage, sitemap, robots: Next je při buildu prerenderuje (s prázdnými daty). **Nasazením se tak do cache dostane prázdná stránka.** Ověřeno: po deployi byl `/spike-d1` HIT s prázdným seznamem, zápis do D1 bez revalidace nic nezměnil (stále prázdný HIT), až `revalidatePath` dal MISS s daty.
   - Proto je součástí deploye krok „po nasazení zavolej `POST /api/revalidate`" (service token Access), který udělá `revalidatePath('/', 'layout')`. Ověřeno: jedno volání zneplatní `/`, `/dily`, `/clanky`, `/sitemap.xml` i spike seznam (vše MISS při další návštěvě); stránky se dorenderují líně.
   - Záchranná síť: `export const revalidate = 900` na seznamech. Když se krok po deployi zapomene, web se do 15 min sám napraví.
4. Každý zápis v administraci revaliduje přesně: detail entity, seznamy, kde se zobrazuje (`/dily`, `/clanky`, `/clanky/tema/..`, `/autori/..`, `/hoste/..`, `/`), `/sitemap.xml`. Při změně slugu navíc starou cestu.
5. Plánované publikování: veřejný dotaz filtruje `status='published' AND published_at <= now`. Stránka zveřejněná v budoucnu by ale zůstala v cache bez změny, proto Cron Trigger (zdarma, 5 na účet) každých 15 minut najde články s `published_at` v posledním okně a zavolá revalidaci. Bez crona se projeví nejpozději s časovou revalidací seznamů (15 min).

Proč ne alternativy: `force-dynamic` na všech stránkách by renderovalo při každé návštěvě (ohrožuje CPU limit 10 ms na Free, žádná cache); build proti vzdálené D1 (`remote` binding) by vázal CI na produkční data a po každém zápisu by stejně musela revalidace běžet; build-time prázdná stránka bez revalidace je nejhorší (viz ověření výše).

Hranice Cache Components: vzor je záměrně bez `"use cache"` (viz verze Next.js).

## Datový model na rok

Legenda: **A** uneseme beze změny, **B** uneseme po úpravě modelu hned (provedeno v migracích), **C** muselo by se předělat (po úpravě žádný scénář není C).

| # | Scénář | Původní model (spike) | Stav | Co se změnilo |
|---|---|---|---|---|
| 1 | Zpravodajský provoz, víc autorů, stránka autora, Person JSON-LD | `articles.author` jen text | B | Tabulka `people` (společná pro hosty, autory, jezdce, moderátory) s `same_as_json`, `job_title`, `bio_md`, foto; vazba `article_people(role='author')`. Autor bez účtu (externista) je jen řádek v `people`, `access_email` váže přihlášeného redaktora na autora. Formát článku `articles.format` (glosa, výsledky, rozbor), `lang` cs/sk, `modified_at` pro `dateModified` |
| 2 | Témata a štítky, jezdci/týmy/závody | téma jen jako text | B | Tabulka `tags(kind, slug, ...)` s `kind` topic/team/race (další druhy bez migrace), `article_tags`, `episode_tags`, `articles.primary_tag_id`, `tags.noindex` pro prázdné štítky. Jezdci jsou `people.is_rider` (host a jezdec je tentýž řádek, žádná duplicita) |
| 3 | Hosté, vazby díl↔host, článek↔host | `article_guests` se slugem, na díle JSON | B | `people` + `episode_people(role guest/host)` + `article_people(role author/guest/about)`. Markdown hosté (`content/hoste`) se importují do `people` jednorázovým skriptem; do té doby zůstávají v souborech a vazby se čtou ze slugu |
| 4 | Plánované publikování, editace, změna slugu | `publish_at` vedle `published_at` (dvojí pravda), bez historie a přesměrování | B | Plánování = `published` + `published_at` v budoucnu (jedna pravda, CHECK drží datum). `article_revisions` (verze, návrat), `modified_at`, `approved_by/at` s CHECK „zveřejnit lze jen schválené" (human in the loop vynucený v DB, i pro LLM koncepty). `redirects(from_path, to_path, status)` pro 301/410. Slug publikovaného dílu/článku se v UI zamyká, změna jen výslovně a vždy zapíše přesměrování |
| 5 | Fotky, autor, licence, výřezy pro Discover | jen URL | B | `media` (R2 klíč originálu, rozměry, `alt`, `credit`, `license` own/permission/cc/agency/unknown, `license_note`, `license_expires_at`, `web_allowed`, `focal_x/y`). Výřezy se nedrží v DB, dělají se za běhu přes Images binding z originálu podle bodu zájmu (16:9 ≥ 1200 px pro Discover, čtverec, OG); admin upozorní na originál pod 1200 px. Fotka po `license_expires_at` se nezobrazuje. Samostatný bucket `legson-media` (R2 Free 10 GB) |
| 6 | Newsletter | nebylo | B | Odběratelé jen v Ecomailu. DB: `newsletter_issues` (předmět, stav, `external_id`, archiv HTML) a `newsletter_issue_articles`. Žádné e-maily odběratelů v DB (GDPR). Přihlášení z webu volá API Ecomailu ze Server Action |
| 7 | E-shop | nebylo | B | `products`, `product_variants` (cena v haléřích, sklad volitelný), `orders` (stavy new/paid/shipped/cancelled/refunded, `number` = variabilní symbol, `public_token` pro stránku se QR kódem, doprava flat/pickup), `order_items` (snapshot názvu a ceny), `number_series` (atomické přidělení čísla `UPDATE ... RETURNING`, ověřeno: `20270001`), `documents` (faktura/dobropis se snapshotem prodávajícího a kupujícího, PDF v R2), `seller_profiles` s `valid_from`. **DPH i neplátce:** ceny jsou vždy konečné, sazba je u řádku (`vat_rate_bp`, neplátce 0), základ a daň se dopočítají; plátcovství se mění novým `seller_profiles` řádkem bez přepisu historie. Osobní údaje v objednávce jdou anonymizovat (`anonymized_at`) po lhůtě uchování dokladů. Změny stavů v `audit_log` |
| 8 | Eventy (výhled) | | A | Nic neblokují: nová tabulka `events` později, znovu použije `people`, `tags`, `media`, `article_*` vazby. URL `/akce` je volná |
| 9 | Vzor stránek závislých na D1 | nerozhodnuto | A | Viz předchozí oddíl |
| 10 | URL struktura | | A | Viz URL mapa. Žádná stávající adresa se nemění |

Další úpravy proti spike modelu: odstraněny CHECKy na seznamech, které porostou (`series`, `source`, `kind`): v D1 nejdou měnit bez přestavby tabulky. Ponechány jen na stavových automatech (`status`). `episodes.transcript_json` přesunut do `episode_transcripts` (velký, mění se jinak než díl, fáze 2 ho plní; indexovat jen schválený). `episodes.guest_slugs_json` nahrazeno `episode_people`.

Ověřeno lokálně (`wrangler d1 migrations apply DB --local` a skript nad scratch D1): všechny 3 migrace se aplikují; vložení autora, hosta-jezdce s týmem, štítků, dílu s novou sérií bez CHECK, článku `lang='sk'`, vazeb, přesměrování a řady objednávek projde; článek zveřejněný k 1. 1. 2027 se v dotazu k 18. 12. 2026 nevrací (plánování funguje); `published` bez `published_at` i bez `approved_at` je odmítnuto CHECKem. Neověřeno: výkon dotazů na realném objemu, FTS vyhledávání (D1 podporuje FTS5, přidá se migrací později).

Rizika modelu: (a) migrace slugů 157 dílů: DB musí reprodukovat stávající algoritmus `normalizeEpisode` (např. `42-radovan-stastny`, `espresso-097`); před spuštěním napsat test, že slugy z DB == slugy z dnešního kódu pro všech 157 dílů. (b) E-shop tabulky jsou nejhrubší část; než se začne stavět, projít je znovu s účetní (jsou prázdné, přestavba nic nestojí). (c) `/clanky/tema/...` je rezervovaný prefix: slug článku `tema` je zakázaný (seznam rezervovaných slugů v adminu).

## URL mapa

Stávající adresy (beze změny, vše zůstává):

| URL | Obsah |
|---|---|
| `/` | domov |
| `/dily`, `/dily/[slug]` | archiv a detail dílu |
| `/clanky`, `/clanky/[slug]`, `/clanky/tema/[tema]` | články, téma (štítek `topic`) |
| `/hoste`, `/hoste/[slug]` | hosté (`people.is_guest`) |
| `/o-nas`, `/predplatne`, `/pro-partnery` | statické |
| `/sitemap.xml`, `/robots.txt` | SEO |

Navržené nové (rezervovat, nestavět předem):

| URL | Obsah | Fáze |
|---|---|---|
| `/autori`, `/autori/[slug]` | autoři (Person JSON-LD, E-E-A-T); slug sdílí s `/hoste/[slug]` | vánoční release nebo hned po |
| `/clanky/tema/[tema]` | téma; **zůstává**, i pro týmy/závody se použijí vlastní prefixy níže | |
| `/jezdci/[slug]` | jezdec (`people.is_rider`), články a díly o něm | zpravodajská fáze |
| `/tymy/[slug]`, `/zavody/[slug]` | štítky `team`, `race` | zpravodajská fáze |
| `/rss.xml` | RSS článků; `/sitemap-news.xml` až při zpravodajském provozu | |
| `/merch`, `/merch/[slug]` | e-shop (kratší a srozumitelnější než `/obchod`) | fáze 1 |
| `/objednavka`, `/objednavka/[token]` | pokladna a stránka objednávky se QR platbou (token, `noindex`) | fáze 1 |
| `/obchodni-podminky`, `/ochrana-osobnich-udaju` | právní stránky (potřeba už u newsletteru) | release |
| `/newsletter`, `/newsletter/[slug]` | přihlášení a veřejný archiv vydání | release |
| `/akce`, `/akce/[slug]` | eventy | výhled |
| `/media/[id]/[nazev].jpg?w=&ar=` | fotky z R2 s ořezem podle bodu zájmu | release |
| `/admin/*`, `/api/admin/*`, `/api/revalidate` | za Access, `noindex`, mimo sitemap | release |

Pravidla: slug je malými písmeny bez diakritiky; publikovaný slug se nemění; změna = záznam v `redirects` (stránka `[slug]` při nenalezení hledá `from_path` a dělá `permanentRedirect`, `status=410` pro trvale smazané); slugy `tema`, `novy`, `admin` a názvy statických podstránek jsou rezervované. Cesty `/hoste/[slug]` a `/autori/[slug]` mají stejný slug pro stejného člověka; `/jezdci/[slug]` také, aby nevznikaly duplicity.

## Cloudflare Access (návrh)

- Aplikace 1: celý web `legson.cz/*` do dne D, politika Allow pro e-maily Jana, Petra, Honzy (a případné tester e-maily). V den D se aplikace 1 **smaže/vypne** (a nastaví `SITE_PUBLIC=true` + redeploy).
- Aplikace 2: `legson.cz/admin*` a `legson.cz/api/admin*` trvale, stejná politika.
- Aplikace 3 (pro automatizaci): `legson.cz/api/revalidate*`, politika Service Auth (service token).
- V aplikaci: `lib/access.ts` (`verifyAccessJwt`) ověří `Cf-Access-Jwt-Assertion`: podpis RS256 proti `https://<team>.cloudflareaccess.com/cdn-cgi/access/certs` (výběr klíče podle `kid`, cache 10 min), `aud`, `iss`, `exp`. Volat ve `/admin` layoutu a v každé Server Action / route handleru (defense in depth; workers.dev adresu vypnout). Bez `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD` vždy odmítne (zavřeno je výchozí).
- `proxy.ts` s Basic Auth po zavedení Access smazat: používá Node middleware, které OpenNext označuje za experimentální, a Access ho zbytečně duplikuje. Do té doby funguje (ověřeno).

## Kroky pro Jana v Cloudflare dashboardu

1. Účet: pokud není, založit na dash.cloudflare.com, zapnout 2FA. Doména `legson.cz`: přidat do Cloudflare (změna NS u registrátora) nebo použít jen `workers.dev` do dne D.
2. **D1:** Storage & databases → D1 → Create database `legson`. Zkopírovat `database_id` do `wrangler.jsonc` (oba bindingy, nahradit `local-placeholder`).
3. **R2:** Storage & databases → R2 → Create bucket `legson-next-cache` (aktivace R2 může chtít kartu; použít kartu určenou pro projekt).
4. **API token pro deploy** (My Profile / Account API tokens → Create Token → šablona „Edit Cloudflare Workers"), doplnit oprávnění Account · D1 · Edit a Account · Workers R2 Storage · Edit. Scope jen na tento účet. Uložit jako GitHub secret `CLOUDFLARE_API_TOKEN`, spolu s `CLOUDFLARE_ACCOUNT_ID`.
5. První nasazení: `npm run deploy` (nebo GitHub Action `cloudflare/wrangler-action@v4`), před tím `wrangler d1 migrations apply DB --remote`. Secrets: `wrangler secret put SITE_PASSWORD` (pokud by se ještě používalo).
6. **Zero Trust:** dash → Zero Trust → onboarding, zvolit tým (např. `legson`), plán **Free** (chce kartu, neúčtuje se). Settings → Authentication: ponechat One-time PIN (e-mailový kód, nic dalšího nezakládat).
7. **Access → Applications → Add → Self-hosted:** vytvořit aplikace 1, 2, 3 podle výše. Politiky: Allow → Emails (3 adresy); u aplikace 3 politika Service Auth + token vytvořený v Access → Service credentials. Z aplikace 2 zkopírovat **Application Audience (AUD) Tag**.
8. Do Workeru dát proměnné `ACCESS_TEAM_DOMAIN` (`legson.cloudflareaccess.com`) a `ACCESS_AUD` (z kroku 7).
9. Workers & Pages → legson-web → Settings → Domains & Routes: přidat `legson.cz`, **vypnout `workers.dev` a Preview URL** (jinak obejdou Access).
10. Settings → Billing: nastavit upozornění; případně Workers Paid pouze pokud CPU metrika po testu ukáže překročení 10 ms. Nastavit Workers spending limit.
11. V den D: smazat Access aplikaci 1, v GitHub proměnných `SITE_PUBLIC=true`, redeploy (robots a sitemap se generují při buildu).

## Automatizace (návrh, neověřeno)

GitHub Action `schedule` (denně ráno) + `workflow_dispatch`: 1) stáhne RSS, 2) pro každý neznámý `guid` vloží do `episodes` řádek `status='published'` (`INSERT ... ON CONFLICT(guid) DO UPDATE` jen RSS pole, podle `rss_hash`) a do `articles` koncept `status='draft', source='llm'` s propojením v `article_episodes`, 3) zapíše do `audit_log` (`actor='sync-rss'`), 4) zavolá `POST /api/revalidate` se service tokenem (`CF-Access-Client-Id`/`Secret`) → `revalidatePath('/dily')`, sitemap atd. Aby se díl objevil bez čekání na denní fetch cache.

Zápis do D1 z Actions: preferovaně REST `POST /accounts/{account_id}/d1/database/{database_id}/query` (body `{sql, params}`, dávkově více příkazů). Dokumentace Cloudflare pro tento endpoint uvádí oprávnění **D1 Write** (stačí i k čtení). Alternativa `wrangler d1 execute DB --remote --file=...` s tokenem s D1 Edit. Token pro sync: **samostatný**, jen Account · D1 · Edit, scope jen na tento účet (ne deploy token). Fáze 2 (přepis a LLM návrh) přidá do téže Action kroky před zápisem; LLM klíč bude další GitHub secret (cena LLM není součástí této kalkulace).

Alternativa bez tokenu: Cron Trigger přímo ve Workeru (vlastní `worker.ts` se `scheduled`), zdarma; pro fázi 1 jednodušší a bezpečnější, pro fázi 2 (LLM, dlouhý běh) méně vhodná. Nerozhodnuto, doporučuji Actions kvůli fázi 2.

## Rizika a odhad práce do 4. 12.

Rizika:
1. **CPU 10 ms na Free** – neověřeno; stránky jsou z cache, ale každá návštěva spouští Next server (cache interception nezapnuta, se zapnutím vyzkoušet). Plán B Paid 5 USD/měs. Měřit hned po prvním nasazení.
2. **Prerender s D1:** vyřešeno vzorem výše (`getDb()` null při buildu + revalidace po deployi), ale krok „revalidace po nasazení" je povinná součást CI.
3. **Cache Components** nefunguje; návrat až po opravě v OpenNext. Zadání/CLAUDE.md s ním počítají, shodit v dokumentaci.
4. **Node middleware experimentální** – řešíme odstraněním proxy.ts.
5. Zero Trust Free limit uživatelů a nutnost karty u R2/Zero Trust neověřeny z dokumentace.
6. Sitemap/robots se zafixují při buildu – zapomenuté `SITE_PUBLIC=true` při redeployi v den D = web zůstane „noindex".
7. `netlify.toml` v repu je nyní bezpředmětný (zatím ponechán).

Hrubý odhad (člověkodny): nasazení + CI + doména + migrace obsahu na D1 čtení 2; administrace (seznam, editace, stavy, měkké mazání, audit) 3-4; napojení Access + test 1; sync RSS Action 1; newsletter se do 4. 12. nevejde s jistotou (formulář + zápis do D1 1, odesílání je nad rámec tohoto spiku). Celkem základ (hosting + administrace) ~7-8 dní, 4. 12. je splnitelné, pokud se začne ihned a Access se nastaví do 30. 11.

## Co je v této větvi

`open-next.config.ts`, `wrangler.jsonc`, `env.d.ts`, `migrations/` (0001 obsah, 0002 newsletter, 0003 e-shop), `lib/db.ts`, `lib/access.ts` + `scripts/test-access.mjs`, `scripts/gen-content.mjs`, úpravy `lib/content.ts`, `lib/episodes.ts`, `next.config.ts`, `package.json`; spike stránky `app/spike-d1/` a `app/api/spike/` (vzor D1+revalidace; smazat před produkcí; `/api/spike` je bez autorizace!).
