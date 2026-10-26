"use client";

import { PauseIcon, PlayIcon } from "@/components/icons";
import { usePlayer, type PlayableEpisode } from "./PlayerProvider";

type Props = {
  episode: PlayableEpisode;
  size?: number;
  iconSize?: number;
  /** Tmavé tlačítko (řádek dílu) nebo karamelové (karty, přehrávač). */
  variant?: "dark" | "accent";
  label?: string;
};

export function PlayButton({ episode, size = 44, iconSize = 16, variant = "dark", label }: Props) {
  const { toggle, isCurrent, playing } = usePlayer();
  const active = isCurrent(episode.slug) && playing;
  const name = label ?? `${episode.series} ${episode.label}`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(episode);
      }}
      aria-label={active ? `Pozastavit ${name}` : `Přehrát ${name}`}
      className={`relative z-10 flex flex-none cursor-pointer items-center justify-center rounded-full border-0 ${
        variant === "dark" ? "bg-ink text-bg" : "bg-accent text-ink"
      }`}
      style={{ width: size, height: size }}
    >
      {active ? <PauseIcon size={iconSize} /> : <PlayIcon size={iconSize} />}
    </button>
  );
}
