import type { D1Database, D1PreparedStatement } from "@cloudflare/workers-types";
import generated from "@/data/content.generated.json";
import { parseFile, TOPICS, topicSlug, type Frontmatter } from "@/lib/content";
import { normalizeEpisode, type EpisodeInput } from "@/lib/episodes";
import { slugify } from "@/lib/format";

/**
 * Zápis obsahu do D1: synchronizace dílů z RSS (opakovaně, i z denní automatizace)
 * a jednorázový import článků a hostů z content/*.md.
 *
 * Pravidla:
 *  - Slug a série uloženého dílu se nikdy nepřepisují (SEO). Když by dnešní parser dal jiný slug,
 *    jen se nahlásí v `slugMismatches` (podmínka spuštění: musí být prázdné).
 *  - Ruční doplňky (fotka, kapitoly, hosté) se zapisují jen při vložení dílu, sync je pak nepřepisuje.
 *  - Import článků a hostů nepřepisuje nic, co už v D1 je (úpravy z administrace mají přednost).
 */

const BATCH = 80;

async function run(db: D1Database, statements: D1PreparedStatement[]) {
  for (let i = 0; i < statements.length; i += BATCH) await db.batch(statements.slice(i, i + BATCH));
}

/** FNV-1a: stačí k poznání, že se položka v RSS změnila. */
function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16);
}

const now = () => new Date().toISOString();

export type SyncReport = {
  feed: number;
  inserted: string[];
  updated: string[];
  unchanged: number;
  skipped: { title: string; reason: string }[];
  slugMismatches: { guid: string; stored: string; computed: string }[];
};

export async function syncEpisodes(db: D1Database, inputs: EpisodeInput[]): Promise<SyncReport> {
  const report: SyncReport = { feed: inputs.length, inserted: [], updated: [], unchanged: 0, skipped: [], slugMismatches: [] };
  const { results: existing } = await db
    .prepare("SELECT guid, slug, rss_hash FROM episodes")
    .all<{ guid: string; slug: string; rss_hash: string | null }>();
  const byGuid = new Map(existing.map((e) => [e.guid, e]));
  const usedSlugs = new Map(existing.map((e) => [e.slug, e.guid]));
  const statements: D1PreparedStatement[] = [];

  for (const input of inputs) {
    if (!input.guid || !input.publishedAt) {
      report.skipped.push({ title: input.title, reason: "chybí guid nebo pubDate" });
      continue;
    }
    const ep = normalizeEpisode(input);
    const rss = {
      title: ep.title,
      description: input.description ?? null,
      audio: input.audio,
      cover: input.cover ?? null,
      duration: input.minutes * 60,
      publishedAt: input.publishedAt,
    };
    const rssHash = hash(JSON.stringify(rss));
    const stored = byGuid.get(input.guid);

    if (stored) {
      if (stored.slug !== ep.slug) report.slugMismatches.push({ guid: input.guid, stored: stored.slug, computed: ep.slug });
      if (stored.rss_hash === rssHash) {
        report.unchanged++;
        continue;
      }
      statements.push(
        db
          .prepare(
            `UPDATE episodes SET title = ?, description = ?, audio_url = ?, cover_url = ?, duration_s = ?,
                    published_at = ?, rss_hash = ?, updated_at = ? WHERE guid = ?`,
          )
          .bind(rss.title, rss.description, rss.audio, rss.cover, rss.duration, rss.publishedAt, rssHash, now(), input.guid),
      );
      report.updated.push(stored.slug);
      continue;
    }

    const owner = usedSlugs.get(ep.slug);
    if (owner && owner !== input.guid) {
      report.skipped.push({ title: input.title, reason: `slug ${ep.slug} už má jiný díl` });
      continue;
    }
    usedSlugs.set(ep.slug, input.guid);
    statements.push(
      db
        .prepare(
          `INSERT INTO episodes (guid, slug, title, description, audio_url, cover_url, image_url, duration_s,
                                 published_at, series, num, rss_hash, chapters_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          input.guid,
          ep.slug,
          rss.title,
          rss.description,
          rss.audio,
          rss.cover,
          input.image ?? null,
          rss.duration,
          rss.publishedAt,
          ep.series,
          ep.num || null,
          rssHash,
          input.chapters?.length ? JSON.stringify(input.chapters) : null,
        ),
    );
    if (ep.guest && ep.guestSlug) {
      // Host vyčtený z názvu vzniká jako koncept profilu (bez published_at); tvůrci ho doplní a zveřejní.
      statements.push(
        db
          .prepare("INSERT INTO people (slug, name, is_guest) VALUES (?, ?, 1) ON CONFLICT(slug) DO UPDATE SET is_guest = 1")
          .bind(ep.guestSlug, ep.guest),
        db
          .prepare(
            "INSERT OR IGNORE INTO episode_people (episode_guid, person_id, role, position) SELECT ?, id, 'guest', 0 FROM people WHERE slug = ?",
          )
          .bind(input.guid, ep.guestSlug),
      );
    }
    report.inserted.push(ep.slug);
  }

  await run(db, statements);
  return report;
}

/* ---------- Jednorázový import content/*.md ---------- */

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : (v ?? "")).trim();
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);
/** Zástupné texty z prototypu ("[role]") se do D1 neukládají. */
const real = (v: string) => (v && !/^\[.*\]$/.test(v) ? v : null);

function files(dir: "clanky" | "hoste") {
  return Object.entries(generated[dir] as Record<string, string>).map(([file, source]) => ({
    slug: file.replace(/\.md$/, ""),
    ...parseFile(source),
  }));
}

export type ImportReport = { guests: string[]; articles: string[] };

export async function importContent(db: D1Database): Promise<ImportReport> {
  const report: ImportReport = { guests: [], articles: [] };
  const statements: D1PreparedStatement[] = [];

  TOPICS.forEach((topic, i) =>
    statements.push(
      db.prepare("INSERT OR IGNORE INTO tags (kind, slug, name, sort_order) VALUES ('topic', ?, ?, ?)").bind(topicSlug(topic), topic, i),
    ),
  );

  // Hosté: profil se doplní i do řádku, který už založila synchronizace dílů, ale jen dokud není zveřejněný.
  for (const { slug, data, body } of files("hoste")) {
    const team = str(data.team);
    if (team) {
      statements.push(
        db.prepare("INSERT OR IGNORE INTO tags (kind, slug, name) VALUES ('team', ?, ?)").bind(slugify(team), team),
      );
    }
    const labels = list(data.episodes);
    statements.push(
      db
        .prepare(
          `INSERT INTO people (slug, name, name_instrumental, name_with_short, role, discipline, bio_md, photo_url,
                               team_tag_id, sort_order, extra_episode_labels_json, is_guest, published_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, (SELECT id FROM tags WHERE kind = 'team' AND slug = ?9), ?10, ?11, 1, ?12)
           ON CONFLICT(slug) DO UPDATE SET
             name = excluded.name, name_instrumental = excluded.name_instrumental,
             name_with_short = excluded.name_with_short, role = excluded.role, discipline = excluded.discipline,
             bio_md = excluded.bio_md, photo_url = excluded.photo_url, team_tag_id = excluded.team_tag_id,
             sort_order = excluded.sort_order, extra_episode_labels_json = excluded.extra_episode_labels_json,
             is_guest = 1, published_at = excluded.published_at, updated_at = excluded.published_at
           WHERE people.published_at IS NULL`,
        )
        .bind(
          slug,
          str(data.name),
          real(str(data.withName)),
          real(str(data.shortWith)),
          real(str(data.role)),
          real(str(data.discipline)),
          real(body),
          real(str(data.photo)),
          team ? slugify(team) : null,
          Number(data.order) || null,
          labels.length ? JSON.stringify(labels) : null,
          now(),
        ),
    );
    report.guests.push(slug);
  }
  await run(db, statements.splice(0));

  // Články: jen ty, které v D1 ještě nejsou. Vazby (téma, hosté, díl) se zakládají jen s nimi.
  const { results } = await db.prepare("SELECT slug FROM articles").all<{ slug: string }>();
  const present = new Set(results.map((r) => r.slug));
  for (const { slug, data, body } of files("clanky") as { slug: string; data: Frontmatter; body: string }[]) {
    if (present.has(slug)) continue;
    const topicKey = slugify(str(data.topic));
    statements.push(
      db
        .prepare(
          `INSERT INTO articles (slug, title, perex, body_md, primary_tag_id, status, published_at, source,
                                 approved_by, approved_at, image_url, image_alt, minutes, featured)
           VALUES (?, ?, ?, ?, (SELECT id FROM tags WHERE kind = 'topic' AND slug = ?), 'published', ?, 'import',
                   'import', ?, ?, ?, ?, ?)`,
        )
        .bind(
          slug,
          str(data.title),
          str(data.perex) || null,
          body,
          topicKey,
          `${str(data.date)}T08:00:00.000Z`,
          now(),
          str(data.image) || null,
          str(data.imageAlt) || null,
          Number(data.minutes) || null,
          Number(data.featured) || 0,
        ),
    );
    for (const tag of list(data.tags)) {
      statements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO article_tags (article_id, tag_id)
             SELECT a.id, t.id FROM articles a, tags t WHERE a.slug = ? AND t.kind = 'topic' AND t.slug = ?`,
          )
          .bind(slug, slugify(tag)),
      );
    }
    list(data.guests).forEach((guest, i) =>
      statements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO article_people (article_id, person_id, role, position)
             SELECT a.id, p.id, 'guest', ? FROM articles a, people p WHERE a.slug = ? AND p.slug = ?`,
          )
          .bind(i, slug, guest),
      ),
    );
    // "rozhovor-40" / "espresso-093"; u zdvojeného čísla (#28) vyhrává novější díl jako dřív na webu.
    const [series, num] = str(data.episode).split("-");
    if (series && num) {
      statements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO article_episodes (article_id, episode_guid, position)
             SELECT (SELECT id FROM articles WHERE slug = ?), guid, 0 FROM episodes
              WHERE lower(series) = ? AND num = ? ORDER BY published_at DESC LIMIT 1`,
          )
          .bind(slug, series, Number(num)),
      );
    }
    report.articles.push(slug);
  }
  await run(db, statements);
  return report;
}
