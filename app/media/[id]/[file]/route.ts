import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { editorFrom } from "@/lib/editor";
import { isUsable, type MediaRow } from "@/lib/media";

/**
 * Fotka z knihovny. Bez parametrů originál, `?w=1200` zmenšení, `&ar=16:9` výřez kolem bodu zájmu.
 * Fotka s propadlou nebo neznámou licencí se nevydá (404). Šířky jsou omezené na pevný seznam,
 * aby šlo udržet počet transformací v bezplatném limitu Images.
 */
const WIDTHS = [320, 640, 960, 1200, 1600, 2000];
const RATIOS: Record<string, number> = { "16:9": 16 / 9, "1:1": 1, "4:5": 4 / 5, "3:2": 3 / 2, "1.91:1": 1.91 };

export async function GET(request: Request, { params }: RouteContext<"/media/[id]/[file]">) {
  const { id } = await params;
  const db = await getDb();
  const row = db ? await db.prepare("SELECT * FROM media WHERE id = ?").bind(Number(id)).first<MediaRow>() : null;
  // Náhled v administraci ukáže i fotku, kterou web zatím použít nesmí.
  const preview = new URL(request.url).searchParams.get("admin") === "1" && !!(await editorFrom(request.headers));
  if (!row || (!preview && !isUsable(row))) return new Response("Not found", { status: 404 });

  const { env } = await getCloudflareContext({ async: true });
  const object = await env.MEDIA.get(row.r2_key);
  if (!object) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const wanted = Number(url.searchParams.get("w")) || 0;
  const ratio = RATIOS[url.searchParams.get("ar") ?? ""];
  const headers = { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800", "X-Content-Type-Options": "nosniff" };
  if (!wanted && !ratio) {
    return new Response(object.body, { headers: { ...headers, "Content-Type": row.mime } });
  }

  const width = WIDTHS.find((w) => w >= wanted) ?? Math.min(row.width, 2000);
  const result = await env.IMAGES.input(object.body)
    .transform({
      width: Math.min(width, row.width),
      ...(ratio && { height: Math.round(Math.min(width, row.width) / ratio), fit: "cover" as const }),
      gravity: { x: row.focal_x ?? 0.5, y: row.focal_y ?? 0.5, mode: "box-center" as const },
    })
    .output({ format: "image/webp" });
  return result.response({ headers });
}
