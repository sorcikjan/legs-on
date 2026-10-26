import fs from "node:fs/promises";
import path from "node:path";
import { slugify } from "@/lib/format";

/**
 * Články a hosté jsou Markdown soubory s jednoduchým frontmatterem
 * (`klíč: hodnota`, seznamy `[a, b]`). Tělo podporuje odstavce, `## nadpisy`,
 * citace `> text` + `> — autor` a značky `::prehravac` a `::predplatne`.
 */

type Frontmatter = Record<string, string | string[]>;

/** Klíče se seznamem; jinde jsou hranaté závorky placeholder textu ("[role]"). */
const LIST_KEYS = new Set(["tags", "guests", "episodes"]);

function parseFile(source: string): { data: Frontmatter; body: string } {
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

async function readDir(dir: string) {
  "use cache";
  const full = path.join(process.cwd(), "content", dir);
  const files = (await fs.readdir(full)).filter((f) => f.endsWith(".md"));
  return Promise.all(
    files.map(async (file) => ({
      slug: file.replace(/\.md$/, ""),
      ...parseFile(await fs.readFile(path.join(full, file), "utf8")),
    })),
  );
}

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(", ") : (v ?? ""));
const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

/* ---------- Témata ---------- */

export const TOPICS = ["Silnice", "MTB", "Gravel", "Zákulisí týmů", "Příběhy"] as const;
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

export async function getArticles(): Promise<Article[]> {
  const files = await readDir("clanky");
  return files
    .map(({ slug, data, body }) => ({
      slug,
      title: str(data.title),
      perex: str(data.perex),
      topic: (topicFromSlug(slugify(str(data.topic))) ?? "Příběhy") as Topic,
      tags: list(data.tags),
      minutes: Number(data.minutes) || 3,
      date: str(data.date),
      episode: str(data.episode),
      guests: list(data.guests),
      image: str(data.image) || undefined,
      imageAlt: str(data.imageAlt),
      featured: Number(data.featured) || 0,
      blocks: parseBody(body),
    }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, "cs"));
}

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

export async function getGuests(): Promise<Guest[]> {
  const files = await readDir("hoste");
  return files
    .map(({ slug, data, body }) => ({
      slug,
      name: str(data.name),
      role: str(data.role) || "[role]",
      withName: str(data.withName) || str(data.name),
      shortWith: str(data.shortWith) || str(data.name),
      photo: str(data.photo) || undefined,
      discipline: str(data.discipline),
      team: str(data.team),
      episodeLabels: list(data.episodes),
      order: Number(data.order) || 999,
      bio: body || "[Krátké bio hosta.]",
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "cs"));
}

export async function getGuest(slug: string) {
  return (await getGuests()).find((g) => g.slug === slug);
}
