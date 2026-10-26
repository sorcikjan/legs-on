"use client";

import { PauseIcon, PlayIcon } from "@/components/icons";
import { clock } from "@/lib/format";
import { usePlayer, type PlayableEpisode } from "./PlayerProvider";

/** Velký přehrávač v hlavičce detailu dílu. */
export function EpisodePlayer({ episode }: { episode: PlayableEpisode }) {
  const { toggle, isCurrent, playing, time, duration, seek } = usePlayer();
  const current = isCurrent(episode.slug);
  const active = current && playing;
  const total = current && duration ? duration : episode.minutes * 60;
  const now = current ? time : 0;
  const progress = total ? Math.min(100, (now / total) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => toggle(episode)}
        aria-label={active ? "Pozastavit" : `Přehrát ${episode.series.toLowerCase()}`}
        className="flex h-16 w-16 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-accent text-ink"
      >
        {active ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
      </button>
      <div className="min-w-0 flex-[1_1_220px]">
        <div className="relative h-1 bg-dark-line">
          <div className="h-1 bg-bg" style={{ width: `${progress}%` }} />
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.round(total))}
            value={Math.round(now)}
            disabled={!current}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Posun v dílu"
            className="absolute inset-x-0 -top-2 h-5 w-full cursor-pointer opacity-0 disabled:cursor-default"
          />
        </div>
        <div className="mt-2 flex justify-between text-[13px] text-on-dark-subtle">
          <span>{clock(now)}</span>
          <span>{clock(total)}</span>
        </div>
      </div>
    </div>
  );
}

/** Kapitoly – kliknutí přeskočí na čas (seek). */
export function Chapters({
  episode,
  chapters,
}: {
  episode: PlayableEpisode;
  chapters: { start: number | null; label: string }[];
}) {
  const { play } = usePlayer();
  return (
    <div className="border-t-[1.5px] border-ink">
      {chapters.map((c, i) => (
        <button
          key={i}
          type="button"
          disabled={c.start === null}
          onClick={() => c.start !== null && play(episode, c.start)}
          className="flex min-h-11 w-full cursor-pointer items-baseline gap-6 border-0 border-b border-line bg-transparent py-4 text-left font-sans text-[17px] text-ink disabled:cursor-default"
        >
          <span className="w-16 flex-none font-semibold text-muted">
            {c.start === null ? "[mm:ss]" : clock(c.start)}
          </span>
          <span>{c.label}</span>
        </button>
      ))}
    </div>
  );
}
