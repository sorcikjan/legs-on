import { adminDb } from "@/lib/admin/db";

export type ArticleStatus = "draft" | "published" | "withdrawn";

export type AdminArticleRow = {
  id: number;
  slug: string;
  title: string;
  status: ArticleStatus;
  source: string;
  published_at: string | null;
  updated_at: string;
  deleted_at: string | null;
  topic: string | null;
};

export async function listArticles(filter: string | undefined) {
  const db = await adminDb();
  const where =
    filter === "smazane"
      ? "a.deleted_at IS NOT NULL"
      : filter && ["draft", "published", "withdrawn"].includes(filter)
        ? "a.deleted_at IS NULL AND a.status = ?1"
        : "a.deleted_at IS NULL";
  const stmt = db.prepare(
    `SELECT a.id, a.slug, a.title, a.status, a.source, a.published_at, a.updated_at, a.deleted_at, t.name AS topic
       FROM articles a LEFT JOIN tags t ON t.id = a.primary_tag_id
      WHERE ${where}
      ORDER BY CASE a.status WHEN 'draft' THEN 0 ELSE 1 END, COALESCE(a.published_at, a.updated_at) DESC`,
  );
  const { results } = await (where.includes("?1") ? stmt.bind(filter) : stmt).all<AdminArticleRow>();
  return results;
}

export type AdminArticle = {
  id: number;
  slug: string;
  title: string;
  perex: string | null;
  body_md: string;
  status: ArticleStatus;
  source: string;
  primary_tag_id: number | null;
  published_at: string | null;
  modified_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  image_url: string | null;
  image_alt: string | null;
  minutes: number | null;
  featured: number;
  seo_title: string | null;
  seo_description: string | null;
  noindex: number;
  deleted_at: string | null;
  updated_at: string;
  tag_ids: number[];
  episode_guid: string | null;
  guest_ids: number[];
};

export async function getAdminArticle(id: number): Promise<AdminArticle | null> {
  const db = await adminDb();
  const [a, tags, episodes, people] = await db.batch([
    db.prepare("SELECT * FROM articles WHERE id = ?").bind(id),
    db.prepare("SELECT tag_id AS v FROM article_tags WHERE article_id = ?").bind(id),
    db.prepare("SELECT episode_guid AS v FROM article_episodes WHERE article_id = ? ORDER BY position").bind(id),
    db.prepare("SELECT person_id AS v FROM article_people WHERE article_id = ? AND role = 'guest' ORDER BY position").bind(id),
  ]);
  const row = a.results[0] as Omit<AdminArticle, "tag_ids" | "episode_guid" | "guest_ids"> | undefined;
  if (!row) return null;
  const v = <T,>(r: { results: unknown[] }) => (r.results as { v: T }[]).map((x) => x.v);
  return { ...row, tag_ids: v<number>(tags), episode_guid: v<string>(episodes)[0] ?? null, guest_ids: v<number>(people) };
}

export async function articleFormOptions() {
  const db = await adminDb();
  const [topics, episodes, people] = await db.batch([
    db.prepare("SELECT id, name FROM tags WHERE kind = 'topic' AND deleted_at IS NULL ORDER BY sort_order, name"),
    db.prepare(
      `SELECT guid, series, num, title, substr(published_at, 1, 10) AS day FROM episodes
        WHERE deleted_at IS NULL ORDER BY published_at DESC`,
    ),
    db.prepare("SELECT id, name, published_at IS NOT NULL AS published FROM people WHERE is_guest = 1 AND deleted_at IS NULL ORDER BY name"),
  ]);
  return {
    topics: topics.results as { id: number; name: string }[],
    episodes: episodes.results as { guid: string; series: string; num: number | null; title: string; day: string }[],
    people: people.results as { id: number; name: string; published: number }[],
  };
}

export async function articleRevisions(id: number) {
  const db = await adminDb();
  const { results } = await db
    .prepare("SELECT id, title, saved_by, saved_at FROM article_revisions WHERE article_id = ? ORDER BY saved_at DESC LIMIT 20")
    .bind(id)
    .all<{ id: number; title: string; saved_by: string; saved_at: string }>();
  return results;
}
