-- E-shop (fáze 1, rozhodnuto 2026-11-26): jednotky produktů, desítky objednávek ročně, platba QR (SPAYD)
-- s variabilním symbolem, ruční označení "zaplaceno". Staví se po Vánocích; tabulky jsou prázdné a levné
-- na úpravu (do prvního řádku se dají zahodit a vytvořit znovu), proto je tato migrace záměrně hrubší než 0002.
--
-- Prodávající a DPH zatím nejsou známy, model unese obojí:
--  * Ceny jsou VŽDY konečné (s DPH, pokud je prodávající plátce), v haléřích.
--  * Sazba DPH je u řádku objednávky (vat_rate_bp, v setinách procenta: 2100 = 21 %). Neplátce = 0.
--    Základ a daň se dopočítají z konečné ceny, takže přechod neplátce -> plátce nic nepřepisuje.
--  * Údaje prodávajícího se při vystavení dokladu zkopírují do dokladu (snapshot), změna později staré doklady nemění.

CREATE TABLE seller_profiles (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  valid_from    TEXT NOT NULL,
  legal_name    TEXT NOT NULL,
  ico           TEXT,
  dic           TEXT,
  vat_payer     INTEGER NOT NULL DEFAULT 0 CHECK (vat_payer IN (0,1)),
  address_json  TEXT NOT NULL,
  iban          TEXT,                         -- pro QR platbu (SPAYD)
  account_label TEXT,                         -- "123456789/0800"
  email         TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description_md TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','withdrawn')),
  cover_media_id INTEGER REFERENCES media(id),
  sort_order    INTEGER,
  deleted_at    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE product_media (
  product_id    INTEGER NOT NULL REFERENCES products(id),
  media_id      INTEGER NOT NULL REFERENCES media(id),
  position      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, media_id)
);
CREATE TABLE product_variants (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id    INTEGER NOT NULL REFERENCES products(id),
  sku           TEXT UNIQUE,
  label         TEXT NOT NULL,                -- "M", "L", "černá / XL"
  price_minor   INTEGER NOT NULL CHECK (price_minor >= 0),  -- konečná cena v haléřích
  currency      TEXT NOT NULL DEFAULT 'CZK',
  vat_rate_bp   INTEGER NOT NULL DEFAULT 0,   -- výchozí sazba pro nové objednávky
  stock         INTEGER,                      -- NULL = bez evidence skladu
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
  position      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX variants_by_product ON product_variants (product_id);

-- Číselné řady dokladů a objednávek. Přidělení čísla: UPDATE number_series SET next = next + 1 WHERE id = ? RETURNING next - 1
-- (jeden atomický příkaz, bez děr a duplicit).
CREATE TABLE number_series (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kind          TEXT NOT NULL,                -- order | invoice | credit_note
  year          INTEGER NOT NULL,
  prefix        TEXT NOT NULL DEFAULT '',     -- "2027"
  next          INTEGER NOT NULL DEFAULT 1,
  width         INTEGER NOT NULL DEFAULT 4,
  UNIQUE (kind, year)
);

CREATE TABLE orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  number        TEXT NOT NULL UNIQUE,         -- číslo objednávky z řady; je zároveň variabilní symbol (jen číslice)
  public_token  TEXT NOT NULL UNIQUE,         -- náhodný token pro stránku /objednavka/[token] (stav, QR kód)
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','paid','shipped','cancelled','refunded')),
  seller_profile_id INTEGER REFERENCES seller_profiles(id),
  currency      TEXT NOT NULL DEFAULT 'CZK',
  items_total_minor    INTEGER NOT NULL,
  shipping_method      TEXT NOT NULL,         -- flat | pickup
  shipping_total_minor INTEGER NOT NULL DEFAULT 0,
  total_minor          INTEGER NOT NULL,
  -- Zákazník: osobní údaje, které se po zákonné lhůtě uchování účetních dokladů anonymizují (customer_*, address -> NULL).
  customer_name  TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address_json TEXT,                 -- NULL u osobního předání
  billing_address_json  TEXT,
  note          TEXT,
  tracking_code TEXT,
  payment_due_at TEXT,
  paid_at       TEXT,
  shipped_at    TEXT,
  cancelled_at  TEXT,
  refunded_at   TEXT,
  anonymized_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX orders_by_status ON orders (status, created_at DESC);

-- Řádek je snapshot: název a cena v okamžiku objednání (pozdější změna produktu starou objednávku nemění).
CREATE TABLE order_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id),
  variant_id    INTEGER REFERENCES product_variants(id),
  name          TEXT NOT NULL,
  unit_price_minor INTEGER NOT NULL,          -- konečná jednotková cena
  vat_rate_bp   INTEGER NOT NULL DEFAULT 0,
  quantity      INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX order_items_by_order ON order_items (order_id);

-- Doklady (faktura / dobropis / potvrzení o platbě). Strana prodávajícího a kupujícího je snapshot.
CREATE TABLE documents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id      INTEGER NOT NULL REFERENCES orders(id),
  kind          TEXT NOT NULL,                -- invoice | credit_note | receipt
  number        TEXT NOT NULL UNIQUE,         -- z number_series
  issued_at     TEXT NOT NULL,
  taxable_at    TEXT,                         -- DUZP (jen plátce)
  seller_json   TEXT NOT NULL,
  buyer_json    TEXT NOT NULL,
  lines_json    TEXT NOT NULL,                -- řádky se základem, sazbou a daní
  total_minor   INTEGER NOT NULL,
  pdf_r2_key    TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX documents_by_order ON documents (order_id);
-- Změny stavu objednávky se zapisují do audit_log (entity='order', action='status:paid').
