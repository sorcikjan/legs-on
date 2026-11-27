import { cache } from "react";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/format";
import { pragueDay } from "@/lib/rss";

/**
 * Články a hosté jsou v D1. Text článku je Markdown: odstavce, `## nadpisy`,
 * citace `> text` + `> — autor` a značky `::prehravac` a `::predplatne`.
 * Původní Markdown soubory s frontmatterem (`content/`) se do D1 jednorázově importují (lib/sync.ts).
 */

export type Frontmatter = Record<string, string | string[]>;

/** Klíče se seznamem; jinde jsou hranaté závorky placeholder textu ("[role]"). */
const LIST_KEYS = new Set(["tags", "guests", "episodes"]);

export function parseFile(source: string): { data: Frontmatter; body: string } {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: source };
  const data: Frontmatter = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    data[key] = LIST_KEYS.has(key)
      ? value.slice(1, -1).split(",").map((v) => v.trim()).filter(Boolean)
      : value;
  }
  return { data, body: match[2].trim() };
}

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; author?: string }
  | { type: "player" }
  | { type: "subscribe" };

export function parseBody(body: string): Block[] {
  return body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      if (chunk === "::prehravac") return { type: "player" };
      if (chunk === "::predplatne") return { type: "subscribe" };
      if (chunk.startsWith("## ")) return { type: "h2", text: chunk.slice(3) };
      if (chunk.startsWith(">")) {
        const lines = chunk.split("\n").map((l) => l.replace(/^>\s?/, ""));
        const authorLine = lines.findIndex((l) => l.startsWith("— "));
        if (authorLine === -1) return { type: "quote", text: lines.join(" ") };
        return {
          type: "quote",
          text: lines.slice(0, authorLine).join(" "),
          author: lines[authorLine].slice(2),
        };
      }
      return { type: "p", text: chunk.replace(/\n/g, " ") };
    });
}

/* ---------- Témata ---------- */

export const TOPICS = ["Silnice", "MTB", "Gravel", "Cyklokros", "Zákulisí týmů", "Příběhy"] as const;
export type Topic = (typeof TOPICS)[number];

export const topicSlug = (topic: string) => slugify(topic);
export const topicFromSlug = (slug: string) => TOPICS.find((t) => topicSlug(t) === slug);

/* ---------- Články ---------- */

export type Article = {
  slug: string;
  title: string;
  perex: string;
  topic: Topic;
  tags: string[];
  minutes: number;
  date: string;
  /** "rozhovor-40" / "espresso-093" */
  episode: string;
  guests: string[];
  image?: string;
  imageAlt: string;
  featured: number;
  blocks: Block[];
};

type ArticleRow = {
  id: number;
  slug: string;
  title: string;
  perex: string | null;
  body_md: string;
  topic: string | null;
  published_at: string;
  image_url: string | null;
  image_alt: string | null;
  minutes: number | null;
  featured: number;
};

const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 200));

/** Zveřejněné články z D1 (včetně naplánovaných, jejichž čas už nastal). Při buildu (bez D1) prázdné. */
export const getArticles = cache(async (): Promise<Article[]> => {
  const db = await getDb();
  if (!db) return [];
  const now = new Date().toISOString();
  const visible = `a.status = 'published' AND a.deleted_at IS NULL AND a.published_at <= ?1`;
  const [articles, tags, episodes, guests] = await db.batch([
    db
      .prepare(
        `SELECT a.id, a.slug, a.title, a.perex, a.body_md, t.name AS topic, a.published_at, a.image_url,
                a.image_alt, a.minutes, a.featured
           FROM articles a LEFT JOIN tags t ON t.id = a.primary_tag_id
          WHERE ${visible}`,
      )
      .bind(now),
    db
      .prepare(
        `SELECT at.article_id AS id, t.name AS value FROM article_tags at
           JOIN articles a ON a.id = at.article_id JOIN tags t ON t.id = at.tag_id
          WHERE ${visible} ORDER BY t.sort_order, t.name`,
      )
      .bind(now),
    db
      .prepare(
        `SELECT ae.article_id AS id, lower(e.series) || '-' ||
                CASE WHEN e.series = 'Espresso' THEN printf('%03d', e.num) ELSE e.num END AS value
           FROM article_episodes ae JOIN articles a ON a.id = ae.article_id
           JOIN episodes e ON e.guid = ae.episode_guid
          WHERE ${visible} ORDER BY ae.position`,
      )
      .bind(now),
    db
      .prepare(
        `SELECT ap.article_id AS id, p.slug AS value FROM article_people ap
           JOIN articles a ON a.id = ap.article_id JOIN people p ON p.id = ap.person_id
          WHERE ${visible} AND ap.role = 'guest' ORDER BY ap.position`,
      )
      .bind(now),
  ]);
  const group = (rows: unknown[]) => {
    const map = new Map<number, string[]>();
    for (const r of rows as { id: number; value: string }[]) map.set(r.id, [...(map.get(r.id) ?? []), String(r.value)]);
    return map;
  };
  const tagMap = group(tags.results);
  const episodeMap = group(episodes.results);
  const guestMap = group(guests.results);

  return (articles.results as ArticleRow[])
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      perex: a.perex ?? "",
      topic: (topicFromSlug(slugify(a.topic ?? "")) ?? "Příběhy") as Topic,
      tags: tagMap.get(a.id) ?? [],
      minutes: a.minutes ?? readingMinutes(a.body_md),
      date: pragueDay(a.published_at),
      episode: episodeMap.get(a.id)?.[0] ?? "",
      guests: guestMap.get(a.id) ?? [],
      image: a.image_url ?? undefined,
      imageAlt: a.image_alt ?? "",
      featured: a.featured,
      blocks: parseBody(a.body_md),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "cs"));
});

export async function getArticle(slug: string) {
  return (await getArticles()).find((a) => a.slug === slug);
}

/** "Z rozhovoru #40 s Radimem Kořínkem" / "Z Espressa #093" */
export function articleSource(a: Article, guestInstrumental?: string) {
  const [series, num] = a.episode.split("-");
  if (series === "espresso") return `Z Espressa #${num.padStart(3, "0")}`;
  return guestInstrumental ? `Z rozhovoru #${num} s ${guestInstrumental}` : `Z rozhovoru #${num}`;
}

/* ---------- Hosté ---------- */

export type Guest = {
  slug: string;
  name: string;
  role: string;
  /** Jméno v 7. pádě pro "Z rozhovoru #39 s Martinem Janíčkem". */
  withName: string;
  /** Oslovení v nadpisu "Díly s Radimem". */
  shortWith: string;
  photo?: string;
  discipline: string;
  team: string;
  /** Díly, které ještě nejsou v datech (archiv před RSS). */
  episodeLabels: string[];
  /** Pořadí ve výpisu (nejnovější díl první). */
  order: number;
  bio: string;
};

type GuestRow = {
  slug: string;
  name: string;
  role: string | null;
  name_instrumental: string | null;
  name_with_short: string | null;
  photo_url: string | null;
  discipline: string | null;
  team: string | null;
  extra_episode_labels_json: string | null;
  sort_order: number | null;
  bio_md: string | null;
};

/** Hosté se zveřejněným profilem. Při buildu (bez D1) prázdné. */
export const getGuests = cache(async (): Promise<Guest[]> => {
  const db = await getDb();
  if (!db) return [];
  const { results } = await db
    .prepare(
      `SELECT p.slug, p.name, p.role, p.name_instrumental, p.name_with_short, p.photo_url, p.discipline,
              t.name AS team, p.extra_episode_labels_json, p.sort_order, p.bio_md
         FROM people p LEFT JOIN tags t ON t.id = p.team_tag_id
        WHERE p.is_guest = 1 AND p.published_at IS NOT NULL AND p.deleted_at IS NULL`,
    )
    .all<GuestRow>();
  return results
    .map((g) => ({
      slug: g.slug,
      name: g.name,
      role: g.role || "[role]",
      withName: g.name_instrumental || g.name,
      shortWith: g.name_with_short || g.name,
      photo: g.photo_url || undefined,
      discipline: g.discipline ?? "",
      team: g.team ?? "",
      episodeLabels: g.extra_episode_labels_json ? JSON.parse(g.extra_episode_labels_json) : [],
      order: g.sort_order ?? 999,
      bio: g.bio_md || "[Krátké bio hosta.]",
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "cs"));
});

export async function getGuest(slug: string) {
  return (await getGuests()).find((g) => g.slug === slug);
}
