"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import type { FormState } from "@/components/admin/ActionForm";
import { adminDb, audit, nowIso, revalidateWeb } from "@/lib/admin/db";
import { requireEditor } from "@/lib/editor";
import { ACCEPTED, extFor, LICENSES } from "@/lib/media";
import { pragueLocalToIso } from "@/lib/time";

const MAX_BYTES = 15 * 1024 * 1024;
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const orNull = (v: string) => v || null;
const license = (v: string) => (v in LICENSES ? v : "unknown");
const unit = (v: string) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;
};

export async function uploadMedia(_: FormState, form: FormData): Promise<FormState> {
  const editor = await requireEditor();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Vyber fotku." };
  if (!ACCEPTED.includes(file.type)) return { error: "Jen JPG, PNG, WebP nebo AVIF." };
  if (file.size > MAX_BYTES) return { error: "Fotka je větší než 15 MB." };

  const { env } = await getCloudflareContext({ async: true });
  const bytes = await file.arrayBuffer();
  const info = await env.IMAGES.info(new Blob([bytes]).stream()).catch(() => null);
  if (!info) return { error: "Soubor se nedá přečíst jako obrázek." };
  if (!("width" in info)) return { error: "Vektorové obrázky (SVG) nejdou nahrát." };

  const key = `media/${new Date().getFullYear()}/${crypto.randomUUID()}.${extFor(file.type)}`;
  await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: file.type } });
  const db = await adminDb();
  const row = await db
    .prepare(
      `INSERT INTO media (r2_key, mime, width, height, bytes, alt, caption, credit, license)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(key, file.type, info.width, info.height, file.size, orNull(text(form, "alt")), orNull(text(form, "caption")), orNull(text(form, "credit")), license(text(form, "license")))
    .first<{ id: number }>();
  await audit(db, editor, "media", row!.id, "create", { key, name: file.name }).run();
  redirect(`/admin/fotky/${row!.id}?ok=create`);
}

export async function saveMedia(_: FormState, form: FormData): Promise<FormState> {
  const editor = await requireEditor();
  const db = await adminDb();
  const id = Number(form.get("id"));
  const intent = text(form, "intent") || "save";
  const expires = text(form, "license_expires_at");
  await db.batch([
    db
      .prepare(
        `UPDATE media SET alt = ?, caption = ?, credit = ?, credit_url = ?, license = ?, license_note = ?, license_expires_at = ?,
                web_allowed = ?, focal_x = ?, focal_y = ?, deleted_at = ? WHERE id = ?`,
      )
      .bind(
        orNull(text(form, "alt")),
        orNull(text(form, "caption")),
        orNull(text(form, "credit")),
        orNull(text(form, "credit_url")),
        license(text(form, "license")),
        orNull(text(form, "license_note")),
        expires ? pragueLocalToIso(`${expires}T23:59`) : null,
        form.get("web_allowed") === "on" ? 1 : 0,
        unit(text(form, "focal_x")),
        unit(text(form, "focal_y")),
        intent === "delete" ? nowIso() : null,
        id,
      ),
    audit(db, editor, "media", id, intent),
  ]);
  revalidateWeb();
  redirect(intent === "delete" ? "/admin/fotky?ok=delete" : `/admin/fotky/${id}?ok=save`);
}
