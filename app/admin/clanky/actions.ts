"use server";

import type { D1PreparedStatement } from "@cloudflare/workers-types";
import { redirect } from "next/navigation";
import { getAdminArticle } from "@/lib/admin/articles";
import { adminDb, audit, FormError, nowIso, RESERVED_SLUGS, revalidateWeb, SLUG_RE } from "@/lib/admin/db";
import { requireEditor } from "@/lib/editor";
import { slugify } from "@/lib/format";
import { pragueLocalToIso } from "@/lib/time";

export type FormState = { error?: string } | undefined;

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const orNull = (v: string) => v || null;
const ids = (f: FormData, k: string) => f.getAll(k).map(Number).filter((n) => Number.isInteger(n) && n > 0);

/**
 * Uložení článku. `intent`:
 *  save     – uloží; zveřejněný článek zůstává zveřejněný (změna je na webu hned)
 *  publish  – schválí a zveřejní (nebo naplánuje, když je datum v budoucnu); schvaluje přihlášený člověk
 *  withdraw – stáhne z webu (zůstává v administraci)
 *  delete / restore – měkké smazání a obnovení
 */
export async function saveArticle(_: FormState, form: FormData): Promise<FormState> {
  const editor = await requireEditor();
  const db = await adminDb();
  const intent = text(form, "intent") || "save";
  const id = Number(form.get("id")) || null;
  const before = id ? await getAdminArticle(id) : null;
  if (id && !before) return { error: "Článek neexistuje." };

  try {
    if (before && (intent === "delete" || intent === "restore" || intent === "withdraw")) {
      const at = nowIso();
      const sql =
        intent === "delete"
          ? "UPDATE articles SET deleted_at = ?, updated_at = ? WHERE id = ?"
          : intent === "restore"
            ? "UPDATE articles SET deleted_at = NULL, updated_at = ?2 WHERE id = ?3 AND ?1 IS NOT NULL"
            : "UPDATE articles SET status = 'withdrawn', withdrawn_at = ?, updated_at = ? WHERE id = ?";
      await db.batch([db.prepare(sql).bind(at, at, before.id), audit(db, editor, "article", before.id, intent)]);
      revalidateWeb();
      return done(before.id, intent);
    }

    const title = text(form, "title");
    if (!title) throw new FormError("Chybí titulek.");
    const body = String(form.get("body_md") ?? "").replace(/\r\n/g, "\n").trim();
    let slug = text(form, "slug") || slugify(title);
    if (!SLUG_RE.test(slug)) throw new FormError("Adresa (slug) smí obsahovat jen malá písmena bez diakritiky, čísla a pomlčky.");
    if (RESERVED_SLUGS.has(slug)) throw new FormError(`Adresu „${slug}“ nejde použít, je rezervovaná.`);

    const wasLive = before?.status === "published";
    const slugChanged = before && before.slug !== slug;
    if (slugChanged && wasLive && form.get("confirm_slug") !== "on") {
      // Zveřejněná adresa se nemění omylem (SEO); změna vždy zapíše přesměrování.
      slug = before.slug;
      throw new FormError("Článek je zveřejněný: změnu adresy potvrď zaškrtnutím „Změnit adresu“.");
    }
    const clash = await db.prepare("SELECT id FROM articles WHERE slug = ? AND id IS NOT ?").bind(slug, id).first<{ id: number }>();
    if (clash) throw new FormError(`Adresu „${slug}“ už má jiný článek.`);

    const publishing = intent === "publish";
    const status = publishing ? "published" : (before?.status ?? "draft");
    // Prázdné datum = hned. U konceptu se datum nastaví až zveřejněním; naplánovaný článek se smazáním data zveřejní hned.
    const typed = pragueLocalToIso(text(form, "published_at"));
    const publishedAt =
      typed ??
      (status === "published"
        ? before?.published_at && before.published_at <= nowIso()
          ? before.published_at
          : nowIso()
        : null);
    const approvedBy = publishing ? editor : (before?.approved_by ?? null);
    const approvedAt = publishing ? nowIso() : (before?.approved_at ?? null);
    const modifiedAt = wasLive && form.get("substantial") === "on" ? nowIso() : (before?.modified_at ?? null);
    const minutes = Number(text(form, "minutes")) || null;
    const values = [
      slug,
      title,
      orNull(text(form, "perex")),
      body,
      Number(form.get("primary_tag_id")) || null,
      status,
      publishedAt,
      modifiedAt,
      approvedBy,
      approvedAt,
      orNull(text(form, "image_url")),
      orNull(text(form, "image_alt")),
      minutes,
      Number(text(form, "featured")) || 0,
      orNull(text(form, "seo_title")),
      orNull(text(form, "seo_description")),
      form.get("noindex") === "on" ? 1 : 0,
      nowIso(),
    ];

    let articleId = id;
    if (articleId) {
      await db
        .prepare(
          `UPDATE articles SET slug = ?, title = ?, perex = ?, body_md = ?, primary_tag_id = ?, status = ?, published_at = ?,
                  modified_at = ?, approved_by = ?, approved_at = ?, image_url = ?, image_alt = ?, minutes = ?, featured = ?,
                  seo_title = ?, seo_description = ?, noindex = ?, updated_at = ? WHERE id = ?`,
        )
        .bind(...values, articleId)
        .run();
    } else {
      const row = await db
        .prepare(
          `INSERT INTO articles (slug, title, perex, body_md, primary_tag_id, status, published_at, modified_at, approved_by,
                                 approved_at, image_url, image_alt, minutes, featured, seo_title, seo_description, noindex,
                                 updated_at, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual') RETURNING id`,
        )
        .bind(...values)
        .first<{ id: number }>();
      articleId = row!.id;
    }

    const tagIds = [...new Set([Number(form.get("primary_tag_id")) || 0, ...ids(form, "tag_ids")].filter(Boolean))];
    const guestIds = ids(form, "guest_ids");
    const episode = text(form, "episode_guid");
    const statements: D1PreparedStatement[] = [
      db.prepare("DELETE FROM article_tags WHERE article_id = ?").bind(articleId),
      ...tagIds.map((t) => db.prepare("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)").bind(articleId, t)),
      db.prepare("DELETE FROM article_people WHERE article_id = ? AND role = 'guest'").bind(articleId),
      ...guestIds.map((p, i) =>
        db.prepare("INSERT INTO article_people (article_id, person_id, role, position) VALUES (?, ?, 'guest', ?)").bind(articleId, p, i),
      ),
      db.prepare("DELETE FROM article_episodes WHERE article_id = ?").bind(articleId),
      ...(episode ? [db.prepare("INSERT INTO article_episodes (article_id, episode_guid) VALUES (?, ?)").bind(articleId, episode)] : []),
      db
        .prepare("INSERT INTO article_revisions (article_id, title, perex, body_md, saved_by) VALUES (?, ?, ?, ?, ?)")
        .bind(articleId, title, orNull(text(form, "perex")), body, editor),
      audit(db, editor, "article", articleId, before ? (publishing ? "publish" : "update") : "create", { status, slug }),
    ];
    if (slugChanged && wasLive) {
      statements.push(
        db
          .prepare("INSERT OR REPLACE INTO redirects (from_path, to_path, status) VALUES (?, ?, 301)")
          .bind(`/clanky/${before.slug}`, `/clanky/${slug}`),
        // Kdyby nová adresa byla dřív přesměrovaná jinam, přesměrování zruš.
        db.prepare("DELETE FROM redirects WHERE from_path = ?").bind(`/clanky/${slug}`),
      );
    }
    await db.batch(statements);
    revalidateWeb();
    return done(articleId, intent);
  } catch (error) {
    if (error instanceof FormError) return { error: error.message };
    // CHECK v D1: zveřejnit jde jen schválený článek s datem.
    if (String(error).includes("CHECK")) return { error: "Článek nejde uložit v tomto stavu (zveřejnit lze jen schválený s datem)." };
    throw error;
  }
}

function done(id: number, intent: string): never {
  redirect(`/admin/clanky/${id}?ok=${intent}`);
}
