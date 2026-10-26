"use client";

import Link from "next/link";
import { PauseIcon, PlayIcon } from "@/components/icons";
import { clock } from "@/lib/format";
import { usePlayer } from "./PlayerProvider";

/** Sticky mini-player dole – objeví se, jakmile se pustí jakýkoli díl. */
export function MiniPlayer() {
  const { episode, playing, time, duration, toggle, seek } = usePlayer();
  if (!episode) return null;
  const progress = duration ? Math.min(100, (time / duration) * 100) : 0;
  const name = episode.guest ? `${episode.guest}: ${episode.title}` : episode.title;

  return (
    <>
      {/* Rezerva, aby přehrávač nepřekryl patičku */}
      <div aria-hidden="true" className="h-[68px]" />
      <div
        role="region"
        aria-label="Přehrávač"
        className="on-dark fixed inset-x-0 bottom-0 z-50 border-t-2 border-accent bg-ink text-bg"
      >
        <div className="relative h-1 bg-dark-line">
          <div className="h-1 bg-accent" style={{ width: `${progress}%` }} />
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.round(duration))}
            value={Math.round(time)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Posun v dílu"
            className="absolute inset-0 h-4 -translate-y-1.5 w-full cursor-pointer opacity-0"
          />
        </div>
        <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-2.5 md:px-8">
          <button
            type="button"
            onClick={() => toggle()}
            aria-label={playing ? "Pozastavit" : "Přehrát"}
            className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-accent text-ink"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <Link href={`/dily/${episode.slug}`} className="min-w-0 flex-1 leading-[1.3] no-underline">
            <p className="m-0 text-[11px] uppercase tracking-[1px] text-on-dark-subtle">
              {episode.series} {episode.label} · {clock(time)} / {clock(duration)}
            </p>
            <p className="m-0 mt-0.5 truncate text-sm font-medium">{name}</p>
          </Link>
        </div>
      </div>
    </>
  );
}
