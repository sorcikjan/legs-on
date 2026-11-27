"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/admin/ActionForm";
import { textToChapters } from "@/lib/admin/chapters";
import { adminDb, audit, nowIso, revalidateWeb } from "@/lib/admin/db";
import { getAdminEpisode } from "@/lib/admin/episodes";
import { requireEditor } from "@/lib/editor";

/**
 * Díl: název, popis, audio a datum jdou z RSS (mění se na Spotify). Tady se doplňuje jen to, co v RSS není:
 * hosté, kapitoly, fotka bez textu, skrytí. Synchronizace tato pole nikdy nepřepisuje.
 */
export async function saveEpisode(_: FormState, form: FormData): Promise<FormState> {
  const editor = await requireEditor();
  const db = await adminDb();
  const guid = String(form.get("guid") ?? "");
  const before = await getAdminEpisode(guid);
  if (!before) return { error: "Díl neexistuje." };

  const intent = String(form.get("intent") ?? "save");
  const status = intent === "hide" ? "withdrawn" : intent === "show" ? "published" : before.status;
  const chapters = textToChapters(String(form.get("chapters") ?? ""));
  const guestIds = form.getAll("guest_ids").map(Number).filter((n) => n > 0);

  await db.batch([
    db
      .prepare("UPDATE episodes SET image_url = ?, chapters_json = ?, noindex = ?, status = ?, updated_at = ? WHERE guid = ?")
      .bind(
        String(form.get("image_url") ?? "").trim() || null,
        chapters.length ? JSON.stringify(chapters) : null,
        form.get("noindex") === "on" ? 1 : 0,
        status,
        nowIso(),
        guid,
      ),
    db.prepare("DELETE FROM episode_people WHERE episode_guid = ? AND role = 'guest'").bind(guid),
    ...guestIds.map((id, i) =>
      db.prepare("INSERT INTO episode_people (episode_guid, person_id, role, position) VALUES (?, ?, 'guest', ?)").bind(guid, id, i),
    ),
    audit(db, editor, "episode", before.slug, intent === "save" ? "update" : intent, { status, guests: guestIds }),
  ]);
  revalidateWeb();
  redirect(`/admin/dily/${encodeURIComponent(guid)}?ok=${intent}`);
}
