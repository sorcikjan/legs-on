import { revalidatePath } from "next/cache";
import { hasAdminToken, unauthorized } from "@/lib/admin-token";
import { getDb } from "@/lib/db";
import { loadFeed } from "@/lib/episodes";
import { importContent, syncEpisodes } from "@/lib/sync";

/**
 * Synchronizace dílů z RSS do D1. `?content=1` navíc jednorázově naimportuje články a hosty z content/.
 * Odpověď je report; `slugMismatches` musí být prázdné (podmínka spuštění, docs/ROZHODNUTI.md).
 */
export async function POST(request: Request) {
  if (!hasAdminToken(request)) return unauthorized();
  const db = await getDb();
  if (!db) return Response.json({ error: "D1 není k dispozici" }, { status: 503 });

  const episodes = await syncEpisodes(db, await loadFeed());
  const content = new URL(request.url).searchParams.get("content") === "1" ? await importContent(db) : null;

  if (episodes.inserted.length || episodes.updated.length || content) revalidatePath("/", "layout");
  return Response.json({ episodes, content });
}
