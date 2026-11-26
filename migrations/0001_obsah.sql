-- Obsah webu: díly (z RSS), články, lidé (hosté, autoři, jezdci), štítky, fotky, přesměrování.
--
-- Zásady modelu:
--  * Časy: ISO 8601 UTC jako TEXT ('2026-11-26T08:00:00.000Z'), řadí se abecedně správně.
--  * Peníze mimo tento soubor jsou v haléřích (INTEGER). Zde žádné nejsou.
--  * CHECK jen na stavových automatech, které se nebudou rozšiřovat (status). Seznamy, které porostou
--    (série dílů, druhy štítků, formáty článků), CHECK nemají: D1/SQLite neumí CHECK měnit bez přestavby tabulky.
--  * Smazání je jen měkké (deleted_at), vždy obnovitelné. Archiv se nemaže.
--  * Slug publikované stránky se nemění; když se změní, vznikne záznam v `redirects`.

-- ---------- Fotky (soubory v R2, bucket legson-media) ----------
CREATE TABLE media (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key        TEXT NOT NULL UNIQUE,         -- originál v plném rozlišení; výřezy se dělají za běhu (Images binding)
  mime          TEXT NOT NULL,
  width         INTEGER NOT NULL,
  height        INTEGER NOT NULL,
  bytes         INTEGER,
  alt           TEXT,
  caption       TEXT,
  focal_x       REAL,                         -- 0..1, bod zájmu pro automatické ořezy (Discover 16:9, čtverec, OG)
  focal_y       REAL,
  -- Autorství a licence: agenturní fotky mají omezení, web je musí umět respektovat.
  credit        TEXT,                         -- text pod fotkou: "Foto: Jan Novák / ČTK"
  credit_url    TEXT,
  license       TEXT NOT NULL DEFAULT 'unknown', -- own | permission | cc | agency | unknown (bez CHECK)
  license_note  TEXT,                         -- podmínky: "jen k článku o Tour 2026, ne na sociální sítě"
  license_expires_at TEXT,                    -- po tomto datu se fotka na webu nesmí zobrazovat
  web_allowed   INTEGER NOT NULL DEFAULT 1 CHECK (web_allowed IN (0,1)),
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- Discover vyžaduje obrázek aspoň 1200 px na šířku; admin má upozornit, když width < 1200.

-- ---------- Lidé: hosté, autoři, jezdci jsou jedna entita ----------
-- Jeden člověk může být víc věcí (Petr je moderátor i autor, host může být i jezdec).
-- Stránky: /hoste/[slug] (is_guest), /autori/[slug] (is_author), /jezdci/[slug] (is_rider); slug je společný.
CREATE TABLE people (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,                -- "Zdeněk Štybar"
  name_instrumental TEXT,                     -- "Zdeňkem Štybarem" (texty "rozhovor se ...")
  name_with_short TEXT,                       -- "Zdeňkem"
  role          TEXT,                         -- "cyklokrosař", "moderátor"
  discipline    TEXT,
  bio_md        TEXT,
  photo_media_id INTEGER REFERENCES media(id),
  team_tag_id   INTEGER REFERENCES tags(id),
  is_guest      INTEGER NOT NULL DEFAULT 0 CHECK (is_guest IN (0,1)),
  is_author     INTEGER NOT NULL DEFAULT 0 CHECK (is_author IN (0,1)),
  is_rider      INTEGER NOT NULL DEFAULT 0 CHECK (is_rider IN (0,1)),
  is_host       INTEGER NOT NULL DEFAULT 0 CHECK (is_host IN (0,1)),   -- Petr a Honza
  sort_order    INTEGER,
  same_as_json  TEXT,                         -- ["https://www.instagram.com/...", wikipedia, procyclingstats] pro Person JSON-LD
  job_title     TEXT,                         -- pro Person JSON-LD autora
  access_email  TEXT UNIQUE,                  -- e-mail z Cloudflare Access; váže přihlášeného na autora (NULL = bez přihlášení)
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------- Štítky: témata, týmy, závody (jezdci jsou v people) ----------
CREATE TABLE tags (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kind          TEXT NOT NULL,                -- topic | team | race (další přibudou bez migrace)
  slug          TEXT NOT NULL,
  name          TEXT NOT NULL,
  description_md TEXT,                        -- úvodní text indexovatelné stránky štítku
  media_id      INTEGER REFERENCES media(id),
  parent_id     INTEGER REFERENCES tags(id),  -- např. závod -> série
  sort_order    INTEGER,
  noindex       INTEGER NOT NULL DEFAULT 0 CHECK (noindex IN (0,1)), -- prázdné štítky se neindexují
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (kind, slug)
);

-- ---------- Díly ----------
CREATE TABLE episodes (
  guid          TEXT PRIMARY KEY,             -- <guid> z RSS, neměnný klíč
  slug          TEXT NOT NULL UNIQUE,         -- "rozhovor-40", "espresso-097"; po zveřejnění se nemění
  title         TEXT NOT NULL,
  description   TEXT,
  audio_url     TEXT NOT NULL,
  cover_url     TEXT,                         -- čtvercová obálka z RSS
  media_id      INTEGER REFERENCES media(id), -- naše fotka dílu (bez textu)
  duration_s    INTEGER,
  published_at  TEXT NOT NULL,                -- pubDate z RSS
  series        TEXT NOT NULL,                -- Rozhovor | Espresso | Příběhy | Speciál (bez CHECK, přibývají)
  num           INTEGER,
  status        TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','withdrawn')),
  source        TEXT NOT NULL DEFAULT 'rss',  -- rss | manual
  rss_hash      TEXT,                         -- hash položky z RSS; sync přepíše RSS pole jen při změně
  chapters_json TEXT,                         -- ručně doplněné; sync je nikdy nepřepisuje
  noindex       INTEGER NOT NULL DEFAULT 0 CHECK (noindex IN (0,1)),
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX episodes_public ON episodes (status, deleted_at, published_at DESC);
CREATE INDEX episodes_series ON episodes (series, num);

-- Přepis je velký a mění se jinak než díl (fáze 2: audio -> přepis -> návrh článku). Mimo tabulku dílů,
-- aby seznamy dílů nenačítaly stovky kB.
CREATE TABLE episode_transcripts (
  episode_guid  TEXT NOT NULL REFERENCES episodes(guid),
  lang          TEXT NOT NULL DEFAULT 'cs',
  source        TEXT NOT NULL,                -- manual | whisper | ...
  segments_json TEXT NOT NULL,                -- [{speaker, start, text}]
  approved_at   TEXT,                         -- indexovatelný je jen schválený přepis
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (episode_guid, lang, source)
);

CREATE TABLE episode_people (
  episode_guid  TEXT NOT NULL REFERENCES episodes(guid),
  person_id     INTEGER NOT NULL REFERENCES people(id),
  role          TEXT NOT NULL DEFAULT 'guest',  -- guest | host
  position      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (episode_guid, person_id, role)
);
CREATE INDEX episode_people_by_person ON episode_people (person_id);

CREATE TABLE episode_tags (
  episode_guid  TEXT NOT NULL REFERENCES episodes(guid),
  tag_id        INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (episode_guid, tag_id)
);
CREATE INDEX episode_tags_by_tag ON episode_tags (tag_id);

-- ---------- Články ----------
CREATE TABLE articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  perex         TEXT,
  body_md       TEXT NOT NULL DEFAULT '',
  format        TEXT NOT NULL DEFAULT 'clanek', -- clanek | glosa | vysledky | rozbor | rozhovor (bez CHECK)
  lang          TEXT NOT NULL DEFAULT 'cs',     -- cs | sk (web míří na CZ/SK)
  primary_tag_id INTEGER REFERENCES tags(id),   -- hlavní téma (drobečky, /clanky/tema/..)
  cover_media_id INTEGER REFERENCES media(id),
  -- Stav: koncept -> publikováno -> stažený. Plánované publikování = status 'published' s published_at v budoucnosti
  -- (veřejný dotaz filtruje published_at <= now), proto žádné samostatné publish_at.
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','withdrawn')),
  published_at  TEXT,                           -- okamžik zveřejnění (může být v budoucnu)
  modified_at   TEXT,                           -- veřejné "upraveno" (dateModified); nastavuje se jen při podstatné úpravě
  withdrawn_at  TEXT,
  source        TEXT NOT NULL DEFAULT 'manual', -- manual | llm | import
  approved_by   TEXT,                           -- e-mail z Access; LLM koncept bez schválení se nepublikuje
  approved_at   TEXT,
  seo_title     TEXT,
  seo_description TEXT,
  noindex       INTEGER NOT NULL DEFAULT 0 CHECK (noindex IN (0,1)),
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (status != 'published' OR published_at IS NOT NULL),
  -- Zveřejnit lze jen schválené (LLM koncept musí projít člověkem).
  CHECK (status != 'published' OR approved_at IS NOT NULL)
);
CREATE INDEX articles_public ON articles (status, deleted_at, published_at DESC);
CREATE INDEX articles_by_tag ON articles (primary_tag_id, published_at DESC);

CREATE TABLE article_people (
  article_id    INTEGER NOT NULL REFERENCES articles(id),
  person_id     INTEGER NOT NULL REFERENCES people(id),
  role          TEXT NOT NULL,                -- author | guest | about (o kom článek je)
  position      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, person_id, role)
);
CREATE INDEX article_people_by_person ON article_people (person_id, role);

CREATE TABLE article_tags (
  article_id    INTEGER NOT NULL REFERENCES articles(id),
  tag_id        INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (article_id, tag_id)
);
CREATE INDEX article_tags_by_tag ON article_tags (tag_id);

CREATE TABLE article_episodes (
  article_id    INTEGER NOT NULL REFERENCES articles(id),
  episode_guid  TEXT    NOT NULL REFERENCES episodes(guid),
  position      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (article_id, episode_guid)
);
CREATE INDEX article_episodes_by_episode ON article_episodes (episode_guid);

-- Úpravy publikovaného článku: každá uložená verze, jde se vrátit.
CREATE TABLE article_revisions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id    INTEGER NOT NULL REFERENCES articles(id),
  title         TEXT NOT NULL,
  perex         TEXT,
  body_md       TEXT NOT NULL,
  saved_by      TEXT NOT NULL,                -- e-mail nebo "llm"
  saved_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX article_revisions_by_article ON article_revisions (article_id, saved_at DESC);

-- ---------- Přesměrování 301 ----------
-- Při změně slugu publikované stránky admin vloží starou cestu. Stránka [slug], která řádek nenajde,
-- se podívá sem a udělá permanentRedirect. Platí pro díly, články, lidi, štítky i produkty.
CREATE TABLE redirects (
  from_path     TEXT PRIMARY KEY,             -- "/clanky/stary-slug" (bez query, malá písmena)
  to_path       TEXT NOT NULL,
  status        INTEGER NOT NULL DEFAULT 301 CHECK (status IN (301,302,308,410)),  -- 410 = trvale smazáno
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------- Historie změn ----------
CREATE TABLE audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actor         TEXT NOT NULL,                -- e-mail z Access JWT, "sync-rss" nebo "llm"
  entity        TEXT NOT NULL,                -- episode | article | person | tag | media | order | product ...
  entity_id     TEXT NOT NULL,
  action        TEXT NOT NULL,                -- create | update | publish | withdraw | delete | restore | status:<nový>
  diff_json     TEXT
);
CREATE INDEX audit_by_entity ON audit_log (entity, entity_id, at DESC);
