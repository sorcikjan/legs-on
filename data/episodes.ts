import type { EpisodeInput } from "@/lib/episodes";

type EpisodeExtra = { match: string } & Partial<Omit<EpisodeInput, "title" | "date">>;

/**
 * Doplňky k dílům, které v RSS feedu nejsou: fotka bez textu, host, kapitoly,
 * přepis. Díl se hledá podle začátku názvu (`match`). `guest: ""` = název
 * rozhovoru není jméno hosta.
 */
export const episodeExtras: EpisodeExtra[] = [
  { match: "ESPRESSO #97:", image: "/images/espresso-097.jpg", guest: "Zdeněk Štybar" },
  { match: "#42 LEGS:ON", image: "/images/stastny.jpg" },
  { match: "#41 LEGS:ON", image: "/images/polman.jpg" },
  { match: "ESPRESSO #93:", image: "/images/picnic.jpg" },
  {
    match: "#40 LEGS:ON",
    image: "/images/korinek.jpg",
    chapters: [
      { start: 0, label: "Úvod" },
      { start: null, label: "České MTB v 90. letech" },
      { start: null, label: "Olympiáda v XCO a na silnici" },
      { start: null, label: "Tým Česká spořitelna – Accolade" },
      { start: null, label: "Kolik dnes stojí sezona týmu" },
    ],
    transcript: [
      { speaker: "Honza", text: "[Přepis se generuje automaticky z audia a pomáhá dílu ve vyhledávání. Zde začátek rozhovoru…]" },
      { speaker: "Radim Kořínek", text: "[Odpověď hosta…]" },
      { speaker: "", text: "[…]" },
    ],
  },
  { match: "ESPRESSO #88:", guest: "Michal Schlegel" },
  { match: "#38 LEGS:ON", guest: "Lukáš Zahradníček" },
  { match: "#37 LEGS:ON", guest: "Zdeněk Štybar" },
  { match: "#13 LEGS:ON", guest: "" },
];
