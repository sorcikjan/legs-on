import { getDb } from "@/lib/db";

// SPIKE: vzor pro stránky závislé na D1. Seznam je ISR, při buildu se D1 nečte, po zápisu revalidatePath.
export const revalidate = 86400;

export default async function Page() {
  const db = await getDb();
  const rows: { id: number; title: string }[] = db
    ? ((await db.prepare("SELECT id, title FROM articles WHERE deleted_at IS NULL ORDER BY id").all()).results as { id: number; title: string }[])
    : [];
  return (
    <main>
      <p>rendered {new Date().toISOString()}</p>
      <ul>{rows.map((r) => <li key={r.id}>{r.id}: {r.title}</li>)}</ul>
    </main>
  );
}
