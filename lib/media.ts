import type { R2Bucket } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { slugify } from "@/lib/format";

/**
 * Fotky: originál v R2 (bucket legson-media), metadata v tabulce media. Výřezy se dělají za běhu
 * přes Images binding podle bodu zájmu (focal_x/y), takže se ukládá jen originál.
 * Veřejná adresa: /media/{id}/{nazev}.{ext}, volitelně ?w=1200&ar=16:9.
 */

export type MediaRow = {
  id: number;
  r2_key: string;
  mime: string;
  width: number;
  height: number;
  bytes: number | null;
  alt: string | null;
  caption: string | null;
  focal_x: number | null;
  focal_y: number | null;
  credit: string | null;
  credit_url: string | null;
  license: string;
  license_note: string | null;
  license_expires_at: string | null;
  web_allowed: number;
  deleted_at: string | null;
  created_at: string;
};

export const LICENSES: Record<string, string> = {
  own: "Vlastní fotka",
  permission: "Se svolením autora",
  cc: "Creative Commons",
  agency: "Agentura (placená licence)",
  unknown: "Neznámá – nepoužívat",
};

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
export const ACCEPTED = Object.keys(EXT);
export const extFor = (mime: string) => EXT[mime] ?? "jpg";

export function mediaUrl(m: Pick<MediaRow, "id" | "mime" | "caption" | "alt">, opts?: { w?: number; ar?: string }) {
  const name = slugify(m.caption || m.alt || "foto").split("-").slice(0, 6).join("-") || "foto";
  const q = new URLSearchParams();
  if (opts?.w) q.set("w", String(opts.w));
  if (opts?.ar) q.set("ar", opts.ar);
  return `/media/${m.id}/${name}.${extFor(m.mime)}${q.size ? `?${q}` : ""}`;
}

/** Smí se fotka zobrazit na webu? (licence, ruční zákaz, smazání) */
export function isUsable(m: Pick<MediaRow, "web_allowed" | "deleted_at" | "license_expires_at" | "license">) {
  if (m.deleted_at || !m.web_allowed || m.license === "unknown") return false;
  return !m.license_expires_at || m.license_expires_at > new Date().toISOString();
}

export async function mediaBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return env.MEDIA as unknown as R2Bucket;
}
