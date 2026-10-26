import type { Article, Guest } from "@/lib/content";
import type { Episode } from "@/lib/episodes";
import { isoDuration } from "@/lib/format";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const abs = (path: string) => new URL(path, SITE_URL).toString();

const series = {
  "@type": "PodcastSeries",
  name: SITE_NAME,
  url: SITE_URL,
};

const hosts = [
  { "@type": "Person", name: "Petr" },
  { "@type": "Person", name: "Honza" },
];

export function podcastSeriesLd() {
  return {
    "@context": "https://schema.org",
    ...series,
    description: SITE_DESCRIPTION,
    inLanguage: "cs",
    author: hosts,
  };
}

export function podcastEpisodeLd(e: Episode) {
  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: e.guest ? `${e.title} | ${e.guest}` : e.title,
    url: abs(`/dily/${e.slug}`),
    episodeNumber: e.num,
    datePublished: e.date,
    description: e.description,
    timeRequired: isoDuration(e.minutes),
    image: e.image ? abs(e.image) : undefined,
    partOfSeries: series,
    associatedMedia: {
      "@type": "MediaObject",
      contentUrl: e.audio,
      duration: isoDuration(e.minutes),
    },
    ...(e.guest && { actor: { "@type": "Person", name: e.guest } }),
  };
}

export function articleLd(a: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.perex,
    datePublished: a.date,
    inLanguage: "cs",
    url: abs(`/clanky/${a.slug}`),
    image: a.image ? abs(a.image) : undefined,
    author: hosts,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function personLd(g: Guest) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: g.name,
    description: g.role,
    url: abs(`/hoste/${g.slug}`),
    image: g.photo ? abs(g.photo) : undefined,
  };
}

export function aboutLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: abs("/o-nas"),
    mainEntity: hosts.map((h) => ({ ...h, worksFor: series })),
  };
}

export function breadcrumbLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.href),
    })),
  };
}
