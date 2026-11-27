import type { D1Database } from "@cloudflare/workers-types";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

/** D1 pro administraci: ta běží jen za běhu, nikdy při buildu. */
export async function adminDb(): Promise<D1Database> {
  const db = await getDb();
  if (!db) throw new Error("D1 není k dispozici");
  return db;
}

export const nowIso = () => new Date().toISOString();

export function audit(db: D1Database, actor: string, entity: string, entityId: string | number, action: string, diff?: unknown) {
  return db
    .prepare("INSERT INTO audit_log (actor, entity, entity_id, action, diff_json) VALUES (?, ?, ?, ?, ?)")
    .bind(actor, entity, String(entityId), action, diff === undefined ? null : JSON.stringify(diff));
}

/**
 * Po každé změně obsahu: zneplatní celý web. Stránky se dorenderují líně při další návštěvě;
 * při desítkách stránek a jednotkách změn denně je to levnější a spolehlivější než přesný výčet cest.
 */
export function revalidateWeb() {
  revalidatePath("/", "layout");
}

/** Slug: malá písmena bez diakritiky, čísla a pomlčky. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Rezervované slugy (podstránky a budoucí adresy, docs/tech/SPIKE-CLOUDFLARE.md). */
export const RESERVED_SLUGS = new Set(["tema", "novy", "admin", "api", "rss", "newsletter", "autori"]);

export class FormError extends Error {}
