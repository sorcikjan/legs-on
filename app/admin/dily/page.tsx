import Link from "next/link";
import { PageTitle, StatusBadge, Tabs } from "@/components/admin/ui";
import { listEpisodes, seriesLabel } from "@/lib/admin/episodes";
import { pragueDateTime } from "@/lib/time";

const SERIES = ["Espresso", "Rozhovor", "Příběhy", "Speciál"];

export default async function AdminEpisodes({ searchParams }: PageProps<"/admin/dily">) {
  const serie = String((await searchParams).serie ?? "");
  const rows = await listEpisodes(SERIES.includes(serie) ? serie : undefined);
  return (
    <>
      <PageTitle>Díly</PageTitle>
      <p className="m-0 mb-4 text-muted">
        Díly se načítají samy z RSS. Název a popis se mění na Spotify, tady se doplňují hosté, kapitoly a fotka.
      </p>
      <Tabs
        current={serie}
        items={[{ key: "", label: "Vše", href: "/admin/dily" }, ...SERIES.map((s) => ({ key: s, label: s, href: `/admin/dily?serie=${encodeURIComponent(s)}` }))]}
      />
      <table className="w-full border-collapse text-[15px]">
        <thead>
          <tr className="border-b border-ink text-left text-[13px] uppercase text-muted">
            <th className="py-2 pr-3">Díl</th>
            <th className="py-2 pr-3">Název</th>
            <th className="hidden py-2 pr-3 md:table-cell">Hosté</th>
            <th className="hidden py-2 md:table-cell">Vyšel</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.guid} className="border-b border-line align-top">
              <td className="whitespace-nowrap py-2 pr-3">
                {seriesLabel(e.series, e.num)} {e.status !== "published" && <StatusBadge status={e.status} />}
              </td>
              <td className="py-2 pr-3">
                <Link href={`/admin/dily/${encodeURIComponent(e.guid)}`}>{e.title}</Link>
                {!e.image_url && <span className="ml-2 text-[12px] text-muted">bez fotky</span>}
              </td>
              <td className="hidden py-2 pr-3 text-[14px] md:table-cell">{e.guests ?? <span className="text-muted">—</span>}</td>
              <td className="hidden whitespace-nowrap py-2 text-[14px] text-muted md:table-cell">{pragueDateTime(e.published_at).split(" ")[0]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
