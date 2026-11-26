import { getCloudflareContext } from "@opennextjs/cloudflare";

// SPIKE: čtení z D1 ve Server Component; stránka je ISR (revalidate 1 den) a po zápisu se invaliduje přes revalidatePath.
export const revalidate = 86400;

export default async function Page() {
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare("SELECT id, text FROM spike_note ORDER BY id").all<{ id: number; text: string }>();
  return (
    <main>
      <p>rendered {new Date().toISOString()}</p>
      <ul>{results.map((r: { id: number; text: string }) => <li key={r.id}>{r.id}: {r.text}</li>)}</ul>
    </main>
  );
}
