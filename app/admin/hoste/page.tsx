import Link from "next/link";
import { PageTitle, StatusBadge, Tabs } from "@/components/admin/ui";
import { listGuests } from "@/lib/admin/people";

export default async function AdminGuests({ searchParams }: PageProps<"/admin/hoste">) {
  const stav = String((await searchParams).stav ?? "");
  const rows = await listGuests(stav || undefined);
  return (
    <>
      <PageTitle actions={<Link href="/admin/hoste/novy" className="btn btn-dark">Nový host</Link>}>Hosté</PageTitle>
      <p className="m-0 mb-4 text-muted">
        Hosty z nových dílů web zakládá sám jako koncept. Stránku na webu má jen host se zveřejněným profilem.
      </p>
      <Tabs
        current={stav}
        items={[
          { key: "", label: "Vše", href: "/admin/hoste" },
          { key: "zverejnene", label: "Zveřejněné", href: "/admin/hoste?stav=zverejnene" },
          { key: "koncepty", label: "Bez profilu", href: "/admin/hoste?stav=koncepty" },
        ]}
      />
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-ink text-left text-[13px] uppercase text-muted">
            <th className="py-2 pr-3">Jméno</th>
            <th className="py-2 pr-3">Profil</th>
            <th className="py-2">Díly</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.id} className="border-b border-line">
              <td className="py-2 pr-3">
                <Link href={`/admin/hoste/${g.id}`}>{g.name}</Link>
                {!g.photo_url && g.published_at && <span className="ml-2 text-[12px] text-muted">bez fotky</span>}
              </td>
              <td className="py-2 pr-3"><StatusBadge status={g.published_at ? "published" : "draft"} /></td>
              <td className="py-2 text-muted">{g.episodes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
