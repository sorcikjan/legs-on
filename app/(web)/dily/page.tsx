import type { Metadata } from "next";
import { ArchiveList } from "@/components/ArchiveList";
import { CtaBand } from "@/components/CtaBand";
import { EpisodeRow } from "@/components/EpisodeRow";
import { ListenOn } from "@/components/ListenOn";
import { getEpisodes } from "@/lib/episodes";

/** Záchranná síť, kdyby revalidace po nasazení nebo po úpravě selhala (docs/tech/SPIKE-CLOUDFLARE.md). */
export const revalidate = 900;

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
  const rows = Object.fromEntries(episodes.map((e) => [e.slug, <EpisodeRow key={e.slug} episode={e} showYear={e.date.slice(0, 4) !== episodes[0].date.slice(0, 4)} />]));

  return (
    <>
      <ArchiveList items={items} rows={rows} total={String(episodes.length)} />
      <ListenOn />
      <CtaBand placement="dily-band" />
    </>
  );
}
