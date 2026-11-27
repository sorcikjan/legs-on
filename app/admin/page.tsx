import Link from "next/link";
import { displayStatus, PageTitle, StatusBadge } from "@/components/admin/ui";
import { adminDb } from "@/lib/admin/db";
import { pragueDateTime } from "@/lib/time";

export default async function AdminHome() {
  const db = await adminDb();
  const [drafts, counts, guests, recent] = await db.batch([
    db.prepare(
      "SELECT id, title, source, updated_at FROM articles WHERE status = 'draft' AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 20",
    ),
    db.prepare(
      `SELECT (SELECT count(*) FROM episodes WHERE deleted_at IS NULL) AS episodes,
              (SELECT count(*) FROM articles WHERE status = 'published' AND deleted_at IS NULL) AS articles,
              (SELECT count(*) FROM people WHERE is_guest = 1 AND published_at IS NOT NULL AND deleted_at IS NULL) AS guests`,
    ),
    db.prepare(
      `SELECT slug, name FROM people WHERE is_guest = 1 AND published_at IS NULL AND deleted_at IS NULL
        AND id IN (SELECT person_id FROM episode_people ep JOIN episodes e ON e.guid = ep.episode_guid
                    WHERE e.published_at > datetime('now', '-60 days')) ORDER BY name`,
    ),
    db.prepare("SELECT at, actor, entity, entity_id, action FROM audit_log ORDER BY at DESC LIMIT 10"),
  ]);
  const c = counts.results[0] as { episodes: number; articles: number; guests: number };
  const draftRows = drafts.results as { id: number; title: string; source: string; updated_at: string }[];
  const newGuests = guests.results as { slug: string; name: string }[];

  return (
    <>
      <PageTitle actions={<Link href="/admin/clanky/novy" className="btn btn-dark">Nový článek</Link>}>Přehled</PageTitle>
      <p className="m-0 mb-8 text-muted">
        {c.episodes} dílů · {c.articles} zveřejněných článků · {c.guests} zveřejněných hostů
      </p>

      <section className="mb-10">
        <h2 className="m-0 mb-3 text-[20px] font-semibold">Čeká na schválení ({draftRows.length})</h2>
        {draftRows.length === 0 ? (
          <p className="m-0 text-muted">Nic nečeká.</p>
        ) : (
          <ul className="m-0 list-none divide-y divide-line border-y border-line p-0">
            {draftRows.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <StatusBadge status={displayStatus({ status: "draft", published_at: null })} />
                <Link href={`/admin/clanky/${a.id}`} className="flex-1">{a.title}</Link>
                <span className="text-[13px] text-muted">{a.source === "llm" ? "připravil web" : ""} {pragueDateTime(a.updated_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {newGuests.length > 0 && (
        <section className="mb-10">
          <h2 className="m-0 mb-3 text-[20px] font-semibold">Noví hosté bez profilu</h2>
          <p className="m-0 mb-2 text-muted">Z posledních dílů. Doplň fotku a bio a profil zveřejni.</p>
          <p className="m-0 flex flex-wrap gap-3">
            {newGuests.map((g) => (
              <Link key={g.slug} href={`/admin/hoste/${g.slug}`}>{g.name}</Link>
            ))}
          </p>
        </section>
      )}

      <section>
        <h2 className="m-0 mb-3 text-[20px] font-semibold">Poslední změny</h2>
        <ul className="m-0 list-none p-0 text-[14px] text-muted">
          {(recent.results as { at: string; actor: string; entity: string; entity_id: string; action: string }[]).map((r, i) => (
            <li key={i}>
              {pragueDateTime(r.at)} · {r.actor} · {r.entity} {r.entity_id} · {r.action}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
