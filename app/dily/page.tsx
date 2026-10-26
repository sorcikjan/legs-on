import type { Metadata } from "next";
import { ArchiveList } from "@/components/ArchiveList";
import { CtaBand } from "@/components/CtaBand";
import { EpisodeRow } from "@/components/EpisodeRow";
import { ListenOn } from "@/components/ListenOn";
import { getEpisodes } from "@/lib/episodes";
import { STATS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Všechny díly podcastu",
  description:
    "Archiv všech dílů LEGS:ON: velké rozhovory s lidmi z cyklistiky a týdenní Espresso z pelotonu. Hledej podle hosta nebo tématu.",
  alternates: { canonical: "/dily" },
};

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default async function EpisodesPage() {
  const episodes = await getEpisodes();
  const items = episodes.map((e) => ({
    slug: e.slug,
    series: e.series,
    search: fold(`${e.title} ${e.guest ?? ""} ${e.series} ${e.label} ${e.description}`),
  }));
  const rows = Object.fromEntries(episodes.map((e) => [e.slug, <EpisodeRow key={e.slug} episode={e} />]));

  return (
    <>
      <ArchiveList items={items} rows={rows} total={STATS.episodesTotal} />
      <ListenOn />
      <CtaBand placement="dily-band" />
    </>
  );
}
