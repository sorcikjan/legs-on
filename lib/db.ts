import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Přístup k D1. Při `next build` vrací null: build v CI vidí prázdnou nebo žádnou databázi a nesmí do
 * prerenderu "zapéct" prázdný obsah ani spadnout na chybějící tabulky. Volající musí null ošetřit
 * (vrátit prázdný seznam) a stránky se naplní až po nasazení (revalidace, viz docs/tech/SPIKE-CLOUDFLARE.md).
 */
export async function getDb(): Promise<D1Database | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}
