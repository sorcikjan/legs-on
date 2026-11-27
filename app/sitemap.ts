import type { MetadataRoute } from "next";
import { getArticles, getGuests, topicSlug, TOPICS } from "@/lib/content";
import { getEpisodes } from "@/lib/episodes";
import { SITE_URL } from "@/lib/site";

/** Záchranná síť, kdyby revalidace po nasazení nebo po úpravě selhala (docs/tech/SPIKE-CLOUDFLARE.md). */
export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, articles, guests] = await Promise.all([getEpisodes(), getArticles(), getGuests()]);
  const url = (path: string) => `${SITE_URL}${path}`;
  const latest = episodes[0]?.date;

  return [
    { url: url("/"), lastModified: latest, changeFrequency: "weekly", priority: 1 },
    { url: url("/dily"), lastModified: latest, changeFrequency: "weekly", priority: 0.9 },
    { url: url("/clanky"), changeFrequency: "weekly", priority: 0.9 },
    { url: url("/hoste"), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/o-nas"), changeFrequency: "yearly", priority: 0.5 },
    { url: url("/predplatne"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/pro-partnery"), changeFrequency: "yearly", priority: 0.5 },
    ...TOPICS.map((t) => ({ url: url(`/clanky/tema/${topicSlug(t)}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...episodes.filter((e) => !e.noindex).map((e) => ({ url: url(`/dily/${e.slug}`), lastModified: e.date, priority: 0.8 })),
    ...articles.filter((a) => !a.noindex).map((a) => ({ url: url(`/clanky/${a.slug}`), lastModified: a.date, priority: 0.8 })),
    ...guests.map((g) => ({ url: url(`/hoste/${g.slug}`), priority: 0.6 })),
  ];
}
