-- Pole, která web potřebuje hned a v 0001 nebyla.
-- Fotky jsou zatím statické soubory v public/images; po zavedení knihovny fotek (media v R2)
-- je nahradí *_media_id a tyto sloupce se přestanou plnit.

ALTER TABLE episodes ADD COLUMN image_url TEXT;          -- fotka dílu bez textu (/images/...)

ALTER TABLE articles ADD COLUMN image_url TEXT;
ALTER TABLE articles ADD COLUMN image_alt TEXT;
ALTER TABLE articles ADD COLUMN minutes INTEGER;         -- doba čtení; NULL = dopočítat z textu
ALTER TABLE articles ADD COLUMN featured INTEGER NOT NULL DEFAULT 0;  -- pořadí na homepage (0 = ne)

ALTER TABLE people ADD COLUMN photo_url TEXT;
-- Profil hosta je vidět na /hoste/[slug] jen zveřejněný. Hosté vyčtení z názvů dílů vznikají jako koncept.
ALTER TABLE people ADD COLUMN published_at TEXT;
-- Díly, které nejsou v RSS (archiv); text štítku, např. "Rozhovor #5".
ALTER TABLE people ADD COLUMN extra_episode_labels_json TEXT;
