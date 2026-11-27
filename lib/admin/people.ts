import { adminDb } from "@/lib/admin/db";

export type AdminGuestRow = { id: number; slug: string; name: string; published_at: string | null; photo_url: string | null; episodes: number; last: string | null };

export async function listGuests(filter?: string) {
  const db = await adminDb();
  const where = filter === "koncepty" ? "AND p.published_at IS NULL" : filter === "zverejnene" ? "AND p.published_at IS NOT NULL" : "";
  const { results } = await db
    .prepare(
      `SELECT p.id, p.slug, p.name, p.published_at, p.photo_url,
              count(ep.episode_guid) AS episodes, max(e.published_at) AS last
         FROM people p
         LEFT JOIN episode_people ep ON ep.person_id = p.id
         LEFT JOIN episodes e ON e.guid = ep.episode_guid AND e.deleted_at IS NULL
        WHERE p.is_guest = 1 AND p.deleted_at IS NULL ${where}
        GROUP BY p.id ORDER BY last DESC NULLS LAST, p.name`,
    )
    .all<AdminGuestRow>();
  return results;
}

export type AdminPerson = {
  id: number;
  slug: string;
  name: string;
  name_instrumental: string | null;
  name_with_short: string | null;
  role: string | null;
  discipline: string | null;
  bio_md: string | null;
  photo_url: string | null;
  team: string | null;
  sort_order: number | null;
  same_as_json: string | null;
  published_at: string | null;
  deleted_at: string | null;
  episodes: { guid: string; slug: string; title: string; series: string; num: number | null }[];
};

export async function getAdminPerson(id: number): Promise<AdminPerson | null> {
  const db = await adminDb();
  const [p, eps] = await db.batch([
    db.prepare("SELECT p.*, t.name AS team FROM people p LEFT JOIN tags t ON t.id = p.team_tag_id WHERE p.id = ?").bind(id),
    db
      .prepare(
        `SELECT e.guid, e.slug, e.title, e.series, e.num FROM episode_people ep JOIN episodes e ON e.guid = ep.episode_guid
          WHERE ep.person_id = ? AND e.deleted_at IS NULL ORDER BY e.published_at DESC`,
      )
      .bind(id),
  ]);
  const row = p.results[0] as Omit<AdminPerson, "episodes"> | undefined;
  return row ? { ...row, episodes: eps.results as AdminPerson["episodes"] } : null;
}
