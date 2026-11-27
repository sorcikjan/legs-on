import type { Chapter } from "@/lib/episodes";

/** Kapitoly v administraci jako text: řádek "12:34 Název" (nebo "1:02:03 Název"), bez času jen "Název". */
export function chaptersToText(chapters: Chapter[]) {
  return chapters
    .map((c) => {
      if (c.start === null) return c.label;
      const h = Math.floor(c.start / 3600);
      const m = Math.floor((c.start % 3600) / 60);
      const s = String(c.start % 60).padStart(2, "0");
      return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${s} ${c.label}`;
    })
    .join("\n");
}

export function textToChapters(text: string): Chapter[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})\s+(.+)$/);
      if (!m) return { start: null, label: line };
      return { start: Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]), label: m[4].trim() };
    });
}
