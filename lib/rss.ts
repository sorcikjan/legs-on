import type { EpisodeInput } from "./episodes";

/** Parser RSS feedu. Bez aliasů, aby ho mohl použít i scripts/snapshot-feed.mjs. */

function decode(text: string) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return undefined;
  const cdata = m[1].trim().match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return (cdata ? cdata[1] : decode(m[1])).trim();
}

function attr(xml: string, name: string, attribute: string) {
  const value = xml.match(new RegExp(`<${name}[^>]*\\s${attribute}="([^"]+)"`, "i"))?.[1];
  return value && decode(value);
}

function durationMinutes(value?: string) {
  if (!value) return 0;
  const seconds = value.split(":").reduce((acc, part) => acc * 60 + Number(part), 0);
  return Math.round(seconds / 60);
}

function stripHtml(html: string) {
  return decode(html.replace(/<[^>]+>/g, " "))
    .replace(/[⁠​]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])(?=\s|$)/g, "$1")
    .trim();
}

/** Den vydání v Česku: díly vychází kolem půlnoci, v UTC by vyšly o den dřív. */
const pragueDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Prague",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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
        date: pragueDate.format(new Date(pubDate)),
        minutes: durationMinutes(tag(item, "itunes:duration")),
        audio,
        cover: attr(item, "itunes:image", "href"),
        description: description ? stripHtml(description) : undefined,
      },
    ];
  });
}
