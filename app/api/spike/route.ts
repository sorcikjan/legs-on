import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const text = (await request.text()).slice(0, 200);
  await env.DB.prepare("INSERT INTO spike_note (text) VALUES (?)").bind(text).run();
  revalidatePath("/spike-d1");
  return Response.json({ ok: true });
}
