import Link from "next/link";
import { displayStatus, PageTitle, StatusBadge, Tabs } from "@/components/admin/ui";
import { listArticles } from "@/lib/admin/articles";
import { pragueDateTime } from "@/lib/time";

const TABS = [
  { key: "", label: "Vše", href: "/admin/clanky" },
  { key: "draft", label: "Koncepty", href: "/admin/clanky?stav=draft" },
  { key: "published", label: "Zveřejněné", href: "/admin/clanky?stav=published" },
  { key: "withdrawn", label: "Stažené", href: "/admin/clanky?stav=withdrawn" },
  { key: "smazane", label: "Smazané", href: "/admin/clanky?stav=smazane" },
];

export default async function AdminArticles({ searchParams }: PageProps<"/admin/clanky">) {
  const stav = String((await searchParams).stav ?? "");
  const rows = await listArticles(stav || undefined);
  return (
    <>
      <PageTitle actions={<Link href="/admin/clanky/novy" className="btn btn-dark">Nový článek</Link>}>Články</PageTitle>
      <Tabs items={TABS} current={stav} />
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-ink text-left text-[13px] uppercase text-muted">
            <th className="py-2 pr-3">Stav</th>
            <th className="py-2 pr-3">Titulek</th>
            <th className="hidden py-2 pr-3 md:table-cell">Téma</th>
            <th className="hidden py-2 md:table-cell">Zveřejnění</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-line align-top">
              <td className="py-2 pr-3"><StatusBadge status={displayStatus(a)} /></td>
              <td className="py-2 pr-3">
                <Link href={`/admin/clanky/${a.id}`}>{a.title}</Link>
                <div className="text-[13px] text-muted">/clanky/{a.slug}</div>
              </td>
              <td className="hidden py-2 pr-3 md:table-cell">{a.topic}</td>
              <td className="hidden py-2 text-[14px] text-muted md:table-cell">{pragueDateTime(a.published_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-muted">Žádné články.</p>}
    </>
  );
}
