export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { y, m, d };
}

/** "23. 10." */
export function shortDate(iso: string) {
  const { m, d } = parts(iso);
  return `${d}. ${m}.`;
}

/** "23. 10. 2026" */
export function longDate(iso: string) {
  const { y, m, d } = parts(iso);
  return `${d}. ${m}. ${y}`;
}

/** 95 → "1:35", 600 → "10:00" */
export function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${String(m).padStart(2, "0")}:${ss}`;
}

/** ISO 8601 délka pro JSON-LD: 28 → "PT28M" */
export function isoDuration(minutes: number) {
  return `PT${minutes}M`;
}
