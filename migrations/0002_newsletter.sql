-- Newsletter: odběratelé a souhlasy zůstávají v Ecomailu (GDPR, nedržíme je v DB).
-- U nás je jen záznam o odeslaných vydáních, aby šly zobrazit na webu a odkázat z nich na články.
CREATE TABLE newsletter_issues (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT UNIQUE,                  -- pro veřejný archiv /newsletter/[slug]; NULL = neveřejné
  subject       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sent')),
  sent_at       TEXT,
  external_id   TEXT,                         -- ID kampaně v Ecomailu
  body_html     TEXT,                         -- co se odeslalo (pro archiv)
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE newsletter_issue_articles (
  issue_id      INTEGER NOT NULL REFERENCES newsletter_issues(id),
  article_id    INTEGER NOT NULL REFERENCES articles(id),
  position      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (issue_id, article_id)
);
