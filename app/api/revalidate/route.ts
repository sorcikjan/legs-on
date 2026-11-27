import { revalidatePath } from "next/cache";
import { hasAdminToken, unauthorized } from "@/lib/admin-token";

/** Zneplatní celou cache webu. Volá se po každém nasazení (scripts/post-deploy.mjs). */
export async function POST(request: Request) {
  if (!hasAdminToken(request)) return unauthorized();
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true, at: new Date().toISOString() });
}
