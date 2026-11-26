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
| 12 | Schéma | `migrations/0002_obsah.sql` aplikováno do odděleného lokálního D1 | Prošlo. CHECK `status != 'published' OR published_at IS NOT NULL` odmítl neplatný zápis (`SQLITE_CONSTRAINT_CHECK`); join článek→díl vrací očekávaný řádek; měkké smazání filtrováno `deleted_at IS NULL` |
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

Schéma: `migrations/0002_obsah.sql` (wrangler d1 migrations, `0001_spike.sql` smazat při reálné implementaci).

- `episodes`: PK `guid` z RSS, `slug` unikátní, pole z RSS vlastní synchronizace (`rss_hash` pro detekci změny), ručně doplněná pole (`chapters_json`, `transcript_json`, `guest_slugs_json`) sync nikdy nepřepisuje. `status` draft/published/withdrawn, `deleted_at`.
- `articles`: `status` draft → published → withdrawn, `publish_at` (plánování), `published_at`, `source` (manual/llm/import, připraveno na fázi 2), `deleted_at`. CHECK brání published bez data.
- `article_episodes`, `article_guests`: propojení článek-díl-host z dat. Hosté zůstávají v markdownu, odkaz je textový slug bez cizího klíče.
- `audit_log`: kdo (e-mail z Access / `sync-rss`), co, kdy; základ pro obnovení a schvalování LLM návrhů.
- Později bez změny stávajících tabulek: `guests`, `topics`, `newsletter_subscribers`, `newsletter_issues`, `article_revisions`. Plánované publikování: veřejný dotaz filtruje `status='published' AND published_at<=now`, plus cron/Action volá revalidaci.

Architektura: veřejné stránky jsou ISR (R2 cache), čtou D1; admin (`/admin`, Server Actions) zapisuje do D1, zapíše `audit_log` a zavolá `revalidatePath`/`revalidateTag` (ověřeno kap. 11). Tag cache a obsah sdílejí jednu D1 databázi `legson` (dva bindingy, `NEXT_TAG_CACHE_D1` a `DB`); tabulku `revalidations` vytvoří `opennextjs-cloudflare populateCache` samo.

Pozor na prerender: `next build` čte D1 přes binding (v CI by to byl prázdný lokální stav). Veřejné stránky, které závisí na D1, buď musí `generateStaticParams` vracet prázdné (a renderovat se při první návštěvě), nebo se při buildu čte z `--remote`. Doporučení: `generateStaticParams` prázdné + `dynamicParams` (první návštěva rendruje, další jdou z cache); díly z RSS se do indexu a sitemap dostanou z D1 za běhu.

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
2. **Prerender s D1** při buildu v CI (viz architektura); nutno rozhodnout vzor před psaním administrace.
3. **Cache Components** nefunguje; návrat až po opravě v OpenNext. Zadání/CLAUDE.md s ním počítají, shodit v dokumentaci.
4. **Node middleware experimentální** – řešíme odstraněním proxy.ts.
5. Zero Trust Free limit uživatelů a nutnost karty u R2/Zero Trust neověřeny z dokumentace.
6. Sitemap/robots se zafixují při buildu – zapomenuté `SITE_PUBLIC=true` při redeployi v den D = web zůstane „noindex".
7. `netlify.toml` v repu je nyní bezpředmětný (zatím ponechán).

Hrubý odhad (člověkodny): nasazení + CI + doména + migrace obsahu na D1 čtení 2; administrace (seznam, editace, stavy, měkké mazání, audit) 3-4; napojení Access + test 1; sync RSS Action 1; newsletter se do 4. 12. nevejde s jistotou (formulář + zápis do D1 1, odesílání je nad rámec tohoto spiku). Celkem základ (hosting + administrace) ~7-8 dní, 4. 12. je splnitelné, pokud se začne ihned a Access se nastaví do 30. 11.

## Co je v této větvi

`open-next.config.ts`, `wrangler.jsonc`, `env.d.ts`, `migrations/` (0001 spike tabulka, 0002 schéma), `lib/access.ts` + `scripts/test-access.mjs`, `scripts/gen-content.mjs`, úpravy `lib/content.ts`, `lib/episodes.ts`, `next.config.ts`, `package.json`; spike stránky `app/spike-d1/` a `app/api/spike/` (smazat před produkcí; `/api/spike` bez autorizace!).
