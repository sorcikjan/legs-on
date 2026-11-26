-- Obsah webu: díly (z RSS), články. Hosté zatím zůstávají v markdownu (content/hoste), proto se na ně
-- odkazuje textovým slugem bez cizího klíče. Smazání je jen měkké (deleted_at), vždy obnovitelné.
-- Časy jsou ISO 8601 v UTC jako TEXT (řadí se abecedně správně).

CREATE TABLE episodes (
  guid          TEXT PRIMARY KEY,            -- <guid> z RSS, neměnný klíč
  slug          TEXT NOT NULL UNIQUE,        -- např. "rozhovor-40"; po zveřejnění se nemění
  title         TEXT NOT NULL,
  description   TEXT,
  audio_url     TEXT NOT NULL,
  cover_url     TEXT,
  duration_s    INTEGER,
  published_at  TEXT NOT NULL,               -- datum vydání z RSS (pubDate)
  series        TEXT NOT NULL CHECK (series IN ('Rozhovor','Espresso','Příběhy','Speciál')),
  num           INTEGER,
  status        TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','withdrawn')),
  source        TEXT NOT NULL DEFAULT 'rss' CHECK (source IN ('rss','manual')),
  rss_hash      TEXT,                        -- hash položky z RSS; sync přepíše jen při změně
  -- Ručně doplněné tvůrci; sync RSS je nikdy nepřepisuje.
  chapters_json   TEXT,
  transcript_json TEXT,
  guest_slugs_json TEXT,                     -- ["zdenek-stybar"]; později tabulka episode_guests
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX episodes_public ON episodes (status, deleted_at, published_at DESC);

CREATE TABLE articles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  perex         TEXT,
  body_md       TEXT NOT NULL DEFAULT '',
  topic         TEXT,                        -- později tabulka topics
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','withdrawn')),
  publish_at    TEXT,                        -- plánované publikování; NULL = hned po schválení
  published_at  TEXT,
  withdrawn_at  TEXT,
  source        TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','llm','import')),
  author        TEXT,
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- Zveřejněný článek musí mít datum zveřejnění; koncept ne.
  CHECK (status != 'published' OR published_at IS NOT NULL)
);
CREATE INDEX articles_public ON articles (status, deleted_at, published_at DESC);

-- Propojení článek <-> díl (odvoditelné z dat, ne ručně linkované) a článek <-> host.
CREATE TABLE article_episodes (
  article_id    INTEGER NOT NULL REFERENCES articles(id),
  episode_guid  TEXT    NOT NULL REFERENCES episodes(guid),
  PRIMARY KEY (article_id, episode_guid)
);
CREATE INDEX article_episodes_by_episode ON article_episodes (episode_guid);

CREATE TABLE article_guests (
  article_id    INTEGER NOT NULL REFERENCES articles(id),
  guest_slug    TEXT    NOT NULL,
  PRIMARY KEY (article_id, guest_slug)
);

-- Historie změn stavu a obsahu (kdo, kdy, co); základ pro "obnovit" i pro schvalování LLM návrhů.
CREATE TABLE audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actor         TEXT NOT NULL,               -- e-mail z Access JWT, nebo "sync-rss"
  entity        TEXT NOT NULL,               -- 'episode' | 'article'
  entity_id     TEXT NOT NULL,
  action        TEXT NOT NULL,               -- create | update | publish | withdraw | delete | restore
  diff_json     TEXT
);
CREATE INDEX audit_by_entity ON audit_log (entity, entity_id, at DESC);

-- Připraveno na později (zatím neexistuje): guests, topics, newsletter_subscribers, newsletter_issues,
-- article_revisions. Přidají se dalšími migracemi, žádná z nich nemění tabulky výše.
