import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

// SPIKE bez autorizace, před produkcí smazat.
export async function POST(request: Request) {
  const db = await getDb();
  const title = (await request.text()).slice(0, 200);
  await db!.prepare("INSERT INTO articles (slug, title) VALUES (?, ?)").bind(`s-${Date.now()}`, title).run();
  const rv = new URL(request.url).searchParams.get("rv");
  if (rv === "all") revalidatePath("/", "layout");
  else if (rv !== "0") revalidatePath("/spike-d1");
  return Response.json({ ok: true });
}
