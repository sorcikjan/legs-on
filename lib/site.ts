export const SITE_URL = "https://legson.cz";
export const SITE_NAME = "LEGS:ON";

/** Do dne D false: noindex, zákaz v robots.txt a heslo (proxy.ts). Zapíná se proměnnou SITE_PUBLIC=true. */
export const SITE_PUBLIC = process.env.SITE_PUBLIC === "true";
export const SITE_DESCRIPTION =
  "Cyklistický podcast Petra a Honzy. Rozhovory s lidmi, kteří cyklistikou žijí, a každý pátek Espresso z pelotonu.";

/** RSS feed podcastu (Spotify for Creators). Při výpadku se použije záloha data/feed.json. */
export const PODCAST_RSS_URL = process.env.PODCAST_RSS_URL || "https://anchor.fm/s/fa24f0a4/podcast/rss";

/** Placeholdery od tvůrců (docs/ZADANI.md, bod 8) – "#" až do doplnění. */
export const PLATFORMS = {
  spotify: "https://open.spotify.com/show/708thcQeVozgamqcPjyFyu",
  apple: "https://podcasts.apple.com/cz/podcast/legs-on-cyklistick%C3%BD-podcast/id1552634325",
  youtube: "https://www.youtube.com/@legs_on",
  soundcloud: "https://soundcloud.com/legs-on",
} as const;

export const SOCIALS = {
  instagram: "https://www.instagram.com/legs.on_podcast/",
  facebook: "#",
  youtube: "https://www.youtube.com/@legs_on",
} as const;

/** Sociální sítě s vyplněnou adresou ("#" = tvůrci ještě nedodali, nezobrazuje se). */
export const SOCIAL_LINKS = (
  [
    { brand: "instagram", label: "Instagram", href: SOCIALS.instagram },
    { brand: "facebook", label: "Facebook", href: SOCIALS.facebook },
    { brand: "youtube", label: "YouTube", href: SOCIALS.youtube },
  ] as const
).filter((s) => s.href !== "#");

export const CONTACT_EMAIL = "ciao@legson.cz";
export const CONTACT_PHONE = "[telefon]";

export const STATS = {
  episodesTotal: "150+",
  since: 2021,
};

export const PRICE = "[XX] Kč";

const HEROHERO_URL = "https://herohero.co/legson";

/** Odkaz na Herohero s UTM. Používat jen na /predplatne. */
export function heroheroUrl(placement: string) {
  const params = new URLSearchParams({
    utm_source: "legson.cz",
    utm_medium: "web",
    utm_campaign: "predplatne",
    utm_content: placement,
  });
  return `${HEROHERO_URL}?${params}`;
}
