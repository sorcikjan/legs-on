/** Převody mezi UTC (D1) a místním časem v Praze (formuláře administrace). */

function pragueOffsetMs(utcMs: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Prague",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** "2026-12-01T08:00" (Praha, z <input type="datetime-local">) → ISO UTC. Prázdné → null. */
export function pragueLocalToIso(local: string | null | undefined): string | null {
  if (!local) return null;
  const naive = Date.parse(`${local}:00Z`);
  if (Number.isNaN(naive)) return null;
  return new Date(naive - pragueOffsetMs(naive - pragueOffsetMs(naive))).toISOString();
}

/** ISO UTC → "2026-12-01T08:00" v Praze pro <input type="datetime-local">. */
export function isoToPragueLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  return new Date(ms + pragueOffsetMs(ms)).toISOString().slice(0, 16);
}

/** "1. 12. 2026 8:00" */
export function pragueDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("cs-CZ", { timeZone: "Europe/Prague", dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}
