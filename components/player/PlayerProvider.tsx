"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import type { PlayableEpisode } from "@/lib/episodes";

export type { PlayableEpisode };

type PlayerState = {
  episode: PlayableEpisode | null;
  playing: boolean;
  time: number;
  duration: number;
  play: (episode: PlayableEpisode, startAt?: number) => void;
  toggle: (episode?: PlayableEpisode) => void;
  seek: (seconds: number) => void;
  isCurrent: (slug: string) => boolean;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer musí být uvnitř PlayerProvider");
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [episode, setEpisode] = useState<PlayableEpisode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const pendingSeek = useRef<number | null>(null);

  const play = useCallback(
    (next: PlayableEpisode, startAt?: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (episode?.slug !== next.slug) {
        setEpisode(next);
        setTime(startAt ?? 0);
        setDuration(next.minutes * 60);
        pendingSeek.current = startAt ?? null;
        audio.src = next.audio;
        track("play_episode", { episode: `${next.series} ${next.label}` });
      } else if (startAt !== undefined) {
        audio.currentTime = startAt;
      }
      void audio.play().catch(() => setPlaying(false));
    },
    [episode],
  );

  const toggle = useCallback(
    (target?: PlayableEpisode) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (target && target.slug !== episode?.slug) return play(target);
      if (audio.paused) void audio.play().catch(() => setPlaying(false));
      else audio.pause();
    },
    [episode, play],
  );

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = seconds;
    setTime(seconds);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration);
      if (pendingSeek.current !== null) {
        audio.currentTime = pendingSeek.current;
        pendingSeek.current = null;
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
    };
  }, []);

  const isCurrent = useCallback((slug: string) => episode?.slug === slug, [episode]);

  return (
    <PlayerContext.Provider value={{ episode, playing, time, duration, play, toggle, seek, isCurrent }}>
      {children}
      <audio ref={audioRef} preload="none" />
    </PlayerContext.Provider>
  );
}
