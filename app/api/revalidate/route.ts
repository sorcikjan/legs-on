import { revalidatePath } from "next/cache";
import { hasAdminToken, unauthorized } from "@/lib/admin-token";

/** Zneplatní celou cache webu. Volá se po každém nasazení (scripts/post-deploy.mjs). */
export async function POST(request: Request) {
  if (!hasAdminToken(request)) return unauthorized();
  // Krok po nasazení posílá ID svého buildu: dokud odpovídá stará verze, nic nedělej (jinak by
  // revalidace proběhla dřív, než nová verze nahraje svou cache, a web by zůstal prázdný).
  const expected = request.headers.get("x-build-id");
  if (expected && expected !== process.env.APP_BUILD_ID) {
    return Response.json({ revalidated: false, running: process.env.APP_BUILD_ID }, { status: 409 });
  }
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true, build: process.env.APP_BUILD_ID, at: new Date().toISOString() });
}
