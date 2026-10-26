import Link from "next/link";
import { PlayButton } from "@/components/player/PlayButton";
import { playable, type Episode } from "@/lib/episodes";
import { shortDate } from "@/lib/format";

export function SeriesTag({ episode }: { episode: Pick<Episode, "series" | "label"> }) {
  return (
    <span className={episode.series === "Rozhovor" ? "tag-rozhovor" : "tag-espresso"}>
      {episode.series} {episode.label}
    </span>
  );
}

export function episodeMeta(e: Episode) {
  return e.guest && e.series === "Rozhovor" ? `${e.guest} · ${e.minutes} min` : `${e.minutes} min`;
}

/** Řádek dílu: datum · štítek · název (Anton) · délka · kulaté play. */
export function EpisodeRow({ episode, play = true, size = "md" }: { episode: Episode; play?: boolean; size?: "md" | "sm" }) {
  return (
    <div className="flex items-center gap-4 border-b-[1.5px] border-ink py-4 md:flex-wrap md:gap-x-8 md:gap-y-2.5 md:py-5">
      <div className="min-w-0 flex-1 md:contents">
        <div className="flex items-center gap-3.5 md:flex-[0_0_210px]">
          <span className="text-xs font-semibold uppercase tracking-[1px] text-muted md:w-16 md:text-[15px] md:font-medium md:normal-case md:tracking-normal md:text-ink">
            {shortDate(episode.date)}
          </span>
          <SeriesTag episode={episode} />
        </div>
        <Link
          href={`/dily/${episode.slug}`}
          className={`display mt-1.5 block min-w-0 leading-[1.1] no-underline hover:underline md:mt-0 md:flex-[999_1_420px] ${
            size === "md" ? "text-[22px] md:text-[28px]" : "text-[22px] md:text-[26px]"
          }`}
        >
          {episode.title}
        </Link>
        <span className="mt-1 block text-sm text-muted md:mt-0 md:flex-[0_0_auto] md:text-[15px]">
          {episodeMeta(episode)}
        </span>
      </div>
      {play && <PlayButton episode={playable(episode)} />}
    </div>
  );
}

export function EpisodeList({ episodes, play, size }: { episodes: Episode[]; play?: boolean; size?: "md" | "sm" }) {
  return (
    <div className="border-t-[1.5px] border-ink">
      {episodes.map((e) => (
        <EpisodeRow key={e.slug} episode={e} play={play} size={size} />
      ))}
    </div>
  );
}
