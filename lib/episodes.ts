import { cache } from "react";
import { episodeExtras } from "@/data/episodes";
import { getDb } from "@/lib/db";
import feedSnapshot from "@/data/feed.json";
import { slugify } from "@/lib/format";
import { parseRss, pragueDay } from "@/lib/rss";
import { PODCAST_RSS_URL } from "@/lib/site";

export type Series = "Rozhovor" | "Espresso" | "Příběhy" | "Speciál";

export type Chapter = { start: number | null; label: string };
export type TranscriptLine = { speaker: string; text: string };

/** Díl tak, jak přichází z RSS nebo ze zálohy data/feed.json. */
export type EpisodeInput = {
  /** <guid> z RSS – neměnný klíč dílu v databázi. */
  guid?: string;
  /** pubDate z RSS jako ISO 8601 (UTC). */
  publishedAt?: string;
  title: string;
  date: string;
  minutes: number;
  audio: string;
  /** Fotka bez textu (public/images). */
  image?: string;
  /** Čtvercová obálka dílu z RSS – má v sobě název i logo. */
  cover?: string;
  description?: string;
  chapters?: Chapter[];
  transcript?: TranscriptLine[];
  /** Host, pokud ho nejde vyčíst z názvu (např. speciál Espressa). */
  guest?: string;
};

export type Episode = {
  slug: string;
  series: Series;
  num: number;
  /** "#40" / "#093", u nečíslovaných dílů prázdné */
  label: string;
  title: string;
  guest?: string;
  guestSlug?: string;
  date: string;
  minutes: number;
  audio: string;
  image?: string;
  cover?: string;
  description: string;
  chapters: Chapter[];
  transcript: TranscriptLine[];
};

const ESPRESSO_RE = /^ESPRESSO\s*#\s*(\d+)\s*:\s*(.+)$/i;
const ESPRESSO_2021_RE = /^#LEGS:ON ESPRESSO\s*[-–]\s*(.+)$/i;
const PRIBEHY_RE = /^PŘÍBĚHY PELOTONU\s*#\s*(\d+)\s*:\s*(.+)$/i;
const TOUR_RE = /^(.+?)\s*\|\s*Tour de France s Michalem Schlegelem$/i;
const SPECIAL_RE = /^#\s*(\d+)\s+LEGS:ON podcast\s*[-–]\s*SPECIÁL\s+(.+)$/i;
const ROZHOVOR_RE = /^#\s*(\d+)\s+LEGS:ON podcast\s*[-–]\s*(.+?)(?:\s*\|\s*(.+))?$/i;

type Parsed = Pick<Episode, "series" | "num" | "title"> & { guest?: string };

/** Formát dílu z názvu – názvosloví se od roku 2021 několikrát změnilo. */
function parseTitle(raw: string): Parsed {
  let m: RegExpMatchArray | null;
  if ((m = raw.match(ESPRESSO_RE))) return { series: "Espresso", num: Number(m[1]), title: m[2] };
  if ((m = raw.match(ESPRESSO_2021_RE))) return { series: "Espresso", num: 0, title: m[1], guest: m[1] };
  if ((m = raw.match(PRIBEHY_RE))) return { series: "Příběhy", num: Number(m[1]), title: m[2] };
  if ((m = raw.match(TOUR_RE))) return { series: "Speciál", num: 0, title: m[1], guest: "Michal Schlegel" };
  if ((m = raw.match(SPECIAL_RE))) return { series: "Speciál", num: Number(m[1]), title: m[2] };
  if ((m = raw.match(ROZHOVOR_RE))) {
    // Starší rozhovory mají v názvu jen jméno hosta ("Marek Rauchfuss 2").
    const guest = m[3] ?? m[2].replace(/\s+\d+$/, "").replace(/^.*\bfeat\.\s*/, "");
    return { series: "Rozhovor", num: Number(m[1]), title: m[2], guest };
  }
  return { series: "Speciál", num: 0, title: raw };
}

export function normalizeEpisode(input: EpisodeInput): Episode {
  const parsed = parseTitle(input.title.trim());
  const { series, num } = parsed;
  const title = parsed.title.charAt(0).toUpperCase() + parsed.title.slice(1);
  // Prázdný guest v data/episodes.ts znamená, že název není jméno hosta.
  const guest = (input.guest ?? parsed.guest) || undefined;

  const label = episodeLabel(series, num);
  const name = slugify(guest ?? title).split("-").slice(0, 6).join("-");
  let slug: string;
  if (series === "Espresso") slug = num ? `espresso-${String(num).padStart(3, "0")}` : `espresso-${input.date.slice(0, 4)}-${name}`;
  else if (series === "Příběhy") slug = `pribehy-pelotonu-${num}`;
  else if (num) slug = `${num}-${name}`;
  else slug = slugify(title).split("-").slice(0, 8).join("-");

  return {
    slug,
    series,
    num,
    label,
    title,
    guest,
    guestSlug: guest ? slugify(guest) : undefined,
    date: input.date,
    minutes: input.minutes,
    audio: input.audio,
    image: input.image,
    cover: input.cover,
    description: input.description ?? "[Popis dílu chybí v RSS feedu.]",
    chapters: input.chapters ?? [],
    transcript: input.transcript ?? [],
  };
}

/** Díly z RSS (se zálohou data/feed.json) a doplňky z data/episodes.ts. Zdroj pro synchronizaci do D1. */
export async function loadFeed(): Promise<EpisodeInput[]> {
  let inputs: EpisodeInput[] = feedSnapshot;
  if (PODCAST_RSS_URL) {
    try {
      const res = await fetch(PODCAST_RSS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`RSS ${res.status}`);
      const parsed = parseRss(await res.text());
      if (parsed.length === 0) throw new Error("RSS bez dílů");
      inputs = parsed;
    } catch (error) {
      // Výpadek feedu nesmí rozbít synchronizaci.
      console.error("Načtení RSS selhalo, používám data/feed.json:", error);
    }
  }
  // Fotky, kapitoly, přepisy a hosté, kteří nejdou vyčíst z názvu.
  return inputs.map((e) => {
    const extra = episodeExtras.find((x) => e.title.trim().startsWith(x.match));
    return extra ? { ...e, ...extra } : e;
  });
}

type EpisodeRow = {
  guid: string;
  slug: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  image_url: string | null;
  duration_s: number | null;
  published_at: string;
  series: Series;
  num: number | null;
  chapters_json: string | null;
  guest_name: string | null;
  guest_slug: string | null;
};

function episodeLabel(series: string, num: number) {
  return num === 0 ? "" : series === "Espresso" ? `#${String(num).padStart(3, "0")}` : `#${num}`;
}

function rowToEpisode(r: EpisodeRow): Episode {
  const num = r.num ?? 0;
  return {
    slug: r.slug,
    series: r.series,
    num,
    label: episodeLabel(r.series, num),
    title: r.title,
    guest: r.guest_name ?? undefined,
    guestSlug: r.guest_slug ?? undefined,
    date: pragueDay(r.published_at),
    minutes: Math.round((r.duration_s ?? 0) / 60),
    audio: r.audio_url,
    image: r.image_url ?? undefined,
    cover: r.cover_url ?? undefined,
    description: r.description ?? "[Popis dílu chybí v RSS feedu.]",
    chapters: r.chapters_json ? JSON.parse(r.chapters_json) : [],
    transcript: [],
  };
}

/** Zveřejněné díly z D1, nejnovější první. Při buildu (bez D1) prázdné. */
export const getEpisodes = cache(async (): Promise<Episode[]> => {
  const db = await getDb();
  if (!db) return [];
  const { results } = await db
    .prepare(
      `SELECT e.guid, e.slug, e.title, e.description, e.audio_url, e.cover_url, e.image_url, e.duration_s,
              e.published_at, e.series, e.num, e.chapters_json, p.name AS guest_name, p.slug AS guest_slug
         FROM episodes e
         LEFT JOIN episode_people ep ON ep.episode_guid = e.guid AND ep.role = 'guest' AND ep.position = 0
         LEFT JOIN people p ON p.id = ep.person_id AND p.deleted_at IS NULL
        WHERE e.status = 'published' AND e.deleted_at IS NULL
        ORDER BY e.published_at DESC`,
    )
    .all<EpisodeRow>();
  return results.map(rowToEpisode);
});

export async function getEpisode(slug: string) {
  return (await getEpisodes()).find((e) => e.slug === slug);
}

export async function getEpisodesByGuest(guestSlug: string) {
  return (await getEpisodes()).filter((e) => e.guestSlug === guestSlug);
}

/** Štítek dílu, kterým na něj odkazují články: "rozhovor-40" / "espresso-093". */
export function episodeRef(e: Pick<Episode, "series" | "label">) {
  return `${e.series.toLowerCase()}-${e.label.slice(1)}`;
}

/** Najde díl podle štítku z článku: "rozhovor-40" / "espresso-093". */
export async function findEpisodeRef(ref: string) {
  return (await getEpisodes()).find((e) => episodeRef(e) === ref);
}

/** Minimum dat o dílu, které potřebuje přehrávač (posílá se do klienta). */
export type PlayableEpisode = Pick<Episode, "slug" | "series" | "label" | "title" | "guest" | "audio" | "minutes">;

export function playable(e: Episode): PlayableEpisode {
  return { slug: e.slug, series: e.series, label: e.label, title: e.title, guest: e.guest, audio: e.audio, minutes: e.minutes };
}

export function episodeTag(e: Pick<Episode, "series" | "label">) {
  return `${e.series} ${e.label}`.trim();
}
