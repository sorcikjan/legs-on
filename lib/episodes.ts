import { cacheLife } from "next/cache";
import { localEpisodes } from "@/data/episodes";
import { slugify } from "@/lib/format";
import { PODCAST_RSS_URL } from "@/lib/site";

export type Series = "Rozhovor" | "Espresso";

export type Chapter = { start: number | null; label: string };
export type TranscriptLine = { speaker: string; text: string };

/** Díl tak, jak přichází z RSS nebo z lokálních dat. */
export type EpisodeInput = {
  title: string;
  date: string;
  minutes: number;
  audio: string;
  image?: string;
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
  /** "#40" / "#093" */
  label: string;
  title: string;
  guest?: string;
  guestSlug?: string;
  date: string;
  minutes: number;
  audio: string;
  image?: string;
  description: string;
  chapters: Chapter[];
  transcript: TranscriptLine[];
};

const ESPRESSO_RE = /^ESPRESSO\s*#\s*(\d+)\s*:\s*(.+)$/i;
const ROZHOVOR_RE = /^#\s*(\d+)\s+LEGS:ON podcast\s*[-–]\s*(.+?)\s*\|\s*(.+)$/i;

/** Typ dílu z názvu: `ESPRESSO #93: …` vs `#40 LEGS:ON podcast - … | Host`. */
export function normalizeEpisode(input: EpisodeInput): Episode {
  const raw = input.title.trim();
  let series: Series = "Rozhovor";
  let num = 0;
  let title = raw;
  let guest = input.guest;

  const espresso = raw.match(ESPRESSO_RE);
  const rozhovor = raw.match(ROZHOVOR_RE);
  if (espresso) {
    series = "Espresso";
    num = Number(espresso[1]);
    title = espresso[2];
  } else if (rozhovor) {
    num = Number(rozhovor[1]);
    title = rozhovor[2];
    guest = guest ?? rozhovor[3];
  } else {
    num = Number(raw.match(/#\s*(\d+)/)?.[1] ?? 0);
  }

  const label = series === "Espresso" ? `#${String(num).padStart(3, "0")}` : `#${num}`;
  const slug =
    series === "Espresso"
      ? `espresso-${String(num).padStart(3, "0")}`
      : `${num}-${slugify(guest ?? title).split("-").slice(0, 6).join("-")}`;

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
    description: input.description ?? "[Popis dílu se načte z RSS feedu.]",
    chapters: input.chapters ?? [],
    transcript: input.transcript ?? [],
  };
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return undefined;
  return m[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
}

function attr(xml: string, name: string, attribute: string) {
  return xml.match(new RegExp(`<${name}[^>]*\\s${attribute}="([^"]+)"`, "i"))?.[1];
}

function durationMinutes(value?: string) {
  if (!value) return 0;
  const seconds = value.split(":").reduce((acc, part) => acc * 60 + Number(part), 0);
  return Math.round(seconds / 60);
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRss(xml: string): EpisodeInput[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  return items.flatMap((item) => {
    const title = tag(item, "title");
    const pubDate = tag(item, "pubDate");
    const audio = attr(item, "enclosure", "url");
    if (!title || !pubDate || !audio) return [];
    const description = tag(item, "description");
    return [
      {
        title,
        date: new Date(pubDate).toISOString().slice(0, 10),
        minutes: durationMinutes(tag(item, "itunes:duration")),
        audio,
        image: attr(item, "itunes:image", "href"),
        description: description ? stripHtml(description) : undefined,
      },
    ];
  });
}

async function loadFeed(): Promise<EpisodeInput[]> {
  "use cache";
  cacheLife("hours");
  if (!PODCAST_RSS_URL) return localEpisodes;
  try {
    const res = await fetch(PODCAST_RSS_URL);
    if (!res.ok) throw new Error(`RSS ${res.status}`);
    const parsed = parseRss(await res.text());
    if (parsed.length === 0) throw new Error("RSS bez dílů");
    // Kapitoly a přepisy zatím nejsou ve feedu – doplníme je z lokálních dat.
    const local = new Map(localEpisodes.map((e) => [normalizeEpisode(e).slug, e]));
    return parsed.map((e) => {
      const extra = local.get(normalizeEpisode(e).slug);
      return { ...e, chapters: extra?.chapters, transcript: extra?.transcript, guest: extra?.guest };
    });
  } catch (error) {
    // Výpadek feedu nesmí rozbít web.
    console.error("Načtení RSS selhalo, používám lokální data:", error);
    return localEpisodes;
  }
}

export async function getEpisodes(): Promise<Episode[]> {
  const inputs = await loadFeed();
  return inputs.map(normalizeEpisode).sort((a, b) => b.date.localeCompare(a.date));
}

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
  return `${e.series} ${e.label}`;
}
