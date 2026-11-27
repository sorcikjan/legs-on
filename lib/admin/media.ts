import { adminDb } from "@/lib/admin/db";
import { isUsable, mediaUrl, type MediaRow } from "@/lib/media";

export async function listMedia() {
  const db = await adminDb();
  const { results } = await db.prepare("SELECT * FROM media WHERE deleted_at IS NULL ORDER BY created_at DESC").all<MediaRow>();
  return results;
}

/** Nabídka do polí „Fotka“: jen fotky, které se smějí použít. */
export async function mediaOptions() {
  return (await listMedia()).filter(isUsable).map((m) => ({ url: mediaUrl(m), label: m.caption || m.alt || `Fotka ${m.id}` }));
}

export async function getMedia(id: number) {
  const db = await adminDb();
  return db.prepare("SELECT * FROM media WHERE id = ?").bind(id).first<MediaRow>();
}
