export const SITE_URL = "https://legson.cz";
export const SITE_NAME = "LEGS:ON";
export const SITE_DESCRIPTION =
  "Cyklistický podcast Petra a Honzy. Rozhovory s lidmi, kteří cyklistikou žijí, a každý čtvrtek Espresso z pelotonu.";

/** URL RSS feedu podcastu (SoundCloud). Dokud není doplněná, berou se díly z data/episodes.ts. */
export const PODCAST_RSS_URL = process.env.PODCAST_RSS_URL || "";

/** Placeholdery od tvůrců (docs/ZADANI.md, bod 8) – "#" až do doplnění. */
export const PLATFORMS = {
  spotify: "#",
  apple: "#",
  youtube: "#",
  soundcloud: "#",
} as const;

export const SOCIALS = {
  instagram: "#",
  facebook: "#",
  youtube: "#",
} as const;

export const CONTACT_EMAIL = "[e-mail]";
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
