import type { EpisodeInput } from "@/lib/episodes";

/**
 * Lokální data pro prototyp (8 dílů z návrhu). Až bude známá URL RSS feedu
 * (PODCAST_RSS_URL), díly se načtou z něj a tahle data slouží jako záloha.
 */
const TEST_AUDIO = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const localEpisodes: EpisodeInput[] = [
  {
    title: "ESPRESSO #93: Silniční sezona končí, cyklokrosová startuje. Jak dopadne Picnic?",
    date: "2026-10-23",
    minutes: 31,
    audio: TEST_AUDIO,
    image: "/images/picnic.jpg",
    description: "[Popis dílu se načte z RSS feedu.]",
  },
  {
    title: "#40 LEGS:ON podcast - O českém MTB v 90. letech a kolik dnes stojí sezona týmu? | Radim Kořínek",
    date: "2026-10-20",
    minutes: 28,
    audio: TEST_AUDIO,
    image: "/images/korinek.jpg",
    description:
      "Radim Kořínek závodil na olympiádě v cross-country i na silnici a dnes vede MTB tým Česká spořitelna – Accolade. Bavili jsme se o tom, jak vypadalo české MTB v 90. letech a kolik dnes stojí odjet se týmem celou sezonu. Užijte si skvělý povídání.",
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
  {
    title: "ESPRESSO #92: Remco mluvil na Lombardii, Stošek tvořil závod MS v gravelu…",
    date: "2026-10-16",
    minutes: 28,
    audio: TEST_AUDIO,
  },
  {
    title: "ESPRESSO #91: 0,0028 sekundy rozhodlo o evropském titulu Evenepoela",
    date: "2026-10-09",
    minutes: 31,
    audio: TEST_AUDIO,
  },
  {
    title: "ESPRESSO #90: Mistr světa McNulty a všechny spekulace o závodě v Montrealu…",
    date: "2026-10-02",
    minutes: 35,
    audio: TEST_AUDIO,
  },
  {
    title: "ESPRESSO #89: Giro d’Italia má nového šéfa a 32” kola v akci…",
    date: "2026-09-25",
    minutes: 29,
    audio: TEST_AUDIO,
  },
  {
    title: "ESPRESSO #88: Jaký je osobně vítěz Vuelty Enric Mas? Speciál s Michalem Schlegelem",
    date: "2026-09-18",
    minutes: 32,
    audio: TEST_AUDIO,
    guest: "Michal Schlegel",
  },
  {
    title: "#39 LEGS:ON podcast - Proč neplatí, že „všichni dopují“ a o gravel etapáku v Keni | Martin Janíček",
    date: "2026-09-15",
    minutes: 58,
    audio: TEST_AUDIO,
  },
];
