import { adminDb } from "@/lib/admin/db";

export const seriesLabel = (series: string, num: number | null) =>
  `${series}${num ? ` #${series === "Espresso" ? String(num).padStart(3, "0") : num}` : ""}`;

export type AdminEpisodeRow = {
  guid: string;
  slug: string;
  title: string;
  series: string;
  num: number | null;
  status: string;
  published_at: string;
  guests: string | null;
  image_url: string | null;
};

export async function listEpisodes(series?: string) {
  const db = await adminDb();
  const stmt = db.prepare(
    `SELECT e.guid, e.slug, e.title, e.series, e.num, e.status, e.published_at, e.image_url,
            (SELECT group_concat(p.name, ', ') FROM episode_people ep JOIN people p ON p.id = ep.person_id
              WHERE ep.episode_guid = e.guid AND ep.role = 'guest') AS guests
       FROM episodes e WHERE e.deleted_at IS NULL ${series ? "AND e.series = ?1" : ""}
      ORDER BY e.published_at DESC`,
  );
  const { results } = await (series ? stmt.bind(series) : stmt).all<AdminEpisodeRow>();
  return results;
}

export type AdminEpisode = {
  guid: string;
  slug: string;
  title: string;
  description: string | null;
  series: string;
  num: number | null;
  status: string;
  published_at: string;
  image_url: string | null;
  cover_url: string | null;
  chapters_json: string | null;
  noindex: number;
  guest_ids: number[];
};

export async function getAdminEpisode(guid: string): Promise<AdminEpisode | null> {
  const db = await adminDb();
  const [e, people] = await db.batch([
    db.prepare("SELECT * FROM episodes WHERE guid = ?").bind(guid),
    db.prepare("SELECT person_id AS v FROM episode_people WHERE episode_guid = ? AND role = 'guest' ORDER BY position").bind(guid),
  ]);
  const row = e.results[0] as Omit<AdminEpisode, "guest_ids"> | undefined;
  if (!row) return null;
  return { ...row, guest_ids: (people.results as { v: number }[]).map((x) => x.v) };
}

export async function guestOptions() {
  const db = await adminDb();
  const { results } = await db
    .prepare("SELECT id, name, published_at IS NOT NULL AS published FROM people WHERE is_guest = 1 AND deleted_at IS NULL ORDER BY name")
    .all<{ id: number; name: string; published: number }>();
  return results;
}
