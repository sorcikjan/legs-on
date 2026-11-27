"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/admin/ActionForm";
import { adminDb, audit, FormError, nowIso, RESERVED_SLUGS, revalidateWeb, SLUG_RE } from "@/lib/admin/db";
import { getAdminPerson } from "@/lib/admin/people";
import { requireEditor } from "@/lib/editor";
import { slugify } from "@/lib/format";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const orNull = (v: string) => v || null;

/** Profil hosta. Díly a články na stránce hosta se skládají z vazeb, tady se nevyplňují. */
export async function savePerson(_: FormState, form: FormData): Promise<FormState> {
  const editor = await requireEditor();
  const db = await adminDb();
  const intent = text(form, "intent") || "save";
  const id = Number(form.get("id")) || null;
  const before = id ? await getAdminPerson(id) : null;
  if (id && !before) return { error: "Host neexistuje." };

  try {
    const name = text(form, "name");
    if (!name) throw new FormError("Chybí jméno.");
    const slug = text(form, "slug") || slugify(name);
    if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug)) throw new FormError("Neplatná adresa (slug).");
    const wasLive = !!before?.published_at;
    const slugChanged = before && before.slug !== slug;
    if (slugChanged && wasLive && form.get("confirm_slug") !== "on") {
      throw new FormError("Profil je zveřejněný: změnu adresy potvrď zaškrtnutím „Změnit adresu“.");
    }
    const clash = await db.prepare("SELECT id FROM people WHERE slug = ? AND id IS NOT ?").bind(slug, id).first();
    if (clash) throw new FormError(`Adresu „${slug}“ už má jiný člověk.`);

    const team = text(form, "team");
    const sameAs = text(form, "same_as").split(/\s+/).filter((u) => /^https?:\/\//.test(u));
    const publishedAt =
      intent === "publish" ? nowIso() : intent === "unpublish" ? null : (before?.published_at ?? null);
    const deletedAt = intent === "delete" ? nowIso() : intent === "restore" ? null : (before?.deleted_at ?? null);

    const teamStatements = team
      ? [db.prepare("INSERT OR IGNORE INTO tags (kind, slug, name) VALUES ('team', ?, ?)").bind(slugify(team), team)]
      : [];
    const values = [
      slug,
      name,
      orNull(text(form, "name_instrumental")),
      orNull(text(form, "name_with_short")),
      orNull(text(form, "role")),
      orNull(text(form, "discipline")),
      orNull(String(form.get("bio_md") ?? "").replace(/\r\n/g, "\n").trim()),
      orNull(text(form, "photo_url")),
      team ? slugify(team) : null,
      Number(text(form, "sort_order")) || null,
      sameAs.length ? JSON.stringify(sameAs) : null,
      publishedAt,
      deletedAt,
      nowIso(),
    ];
    let personId = id;
    if (personId) {
      await db.batch([
        ...teamStatements,
        db
          .prepare(
            `UPDATE people SET slug = ?, name = ?, name_instrumental = ?, name_with_short = ?, role = ?, discipline = ?, bio_md = ?,
                    photo_url = ?, team_tag_id = (SELECT id FROM tags WHERE kind = 'team' AND slug = ?), sort_order = ?,
                    same_as_json = ?, published_at = ?, deleted_at = ?, updated_at = ?, is_guest = 1 WHERE id = ?`,
          )
          .bind(...values, personId),
      ]);
    } else {
      const res = await db.batch([
        ...teamStatements,
        db
          .prepare(
            `INSERT INTO people (slug, name, name_instrumental, name_with_short, role, discipline, bio_md, photo_url, team_tag_id,
                                 sort_order, same_as_json, published_at, deleted_at, updated_at, is_guest)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM tags WHERE kind = 'team' AND slug = ?), ?, ?, ?, ?, ?, 1) RETURNING id`,
          )
          .bind(...values),
      ]);
      personId = (res.at(-1)!.results[0] as { id: number }).id;
    }
    const after = [audit(db, editor, "person", personId, before ? intent : "create", { slug, published: !!publishedAt })];
    if (slugChanged && wasLive) {
      after.push(
        db.prepare("INSERT OR REPLACE INTO redirects (from_path, to_path, status) VALUES (?, ?, 301)").bind(`/hoste/${before.slug}`, `/hoste/${slug}`),
        db.prepare("DELETE FROM redirects WHERE from_path = ?").bind(`/hoste/${slug}`),
      );
    }
    await db.batch(after);
    revalidateWeb();
    redirect(`/admin/hoste/${personId}?ok=${before ? intent : "create"}`);
  } catch (error) {
    if (error instanceof FormError) return { error: error.message };
    throw error;
  }
}
