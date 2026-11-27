import { notFound, permanentRedirect } from "next/navigation";
import { getDb } from "@/lib/db";

/**
 * Volá detailní stránka, když obsah nenašla: stará adresa po změně slugu vede trvale na novou
 * (tabulka redirects), trvale smazaná (410) i neznámá končí 404.
 */
export async function redirectOrNotFound(path: string): Promise<never> {
  const db = await getDb();
  const row = db
    ? await db.prepare("SELECT to_path, status FROM redirects WHERE from_path = ?").bind(path.toLowerCase()).first<{ to_path: string; status: number }>()
    : null;
  if (row && row.status !== 410) permanentRedirect(row.to_path);
  notFound();
}
