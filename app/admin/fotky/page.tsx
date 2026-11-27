import Link from "next/link";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field, input, Notice, PageTitle, StatusBadge } from "@/components/admin/ui";
import { listMedia } from "@/lib/admin/media";
import { isUsable, LICENSES, mediaUrl } from "@/lib/media";
import { uploadMedia } from "./actions";

export default async function AdminMedia({ searchParams }: PageProps<"/admin/fotky">) {
  const ok = String((await searchParams).ok ?? "");
  const rows = await listMedia();
  return (
    <>
      <PageTitle>Fotky</PageTitle>
      {ok === "delete" && <Notice>Fotka je smazaná.</Notice>}
      <ActionForm action={uploadMedia} className="mb-10 grid gap-4 border border-ink bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <Field label="Nová fotka" hint="JPG, PNG, WebP, max. 15 MB. Pro Google Discover aspoň 1200 px na šířku.">
          <input type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" required className="text-[14px]" />
        </Field>
        <Field label="Popis (alt)" hint="Co je na fotce, pro nevidomé a Google.">
          <input name="alt" className={input} />
        </Field>
        <Field label="Autor / zdroj" hint="Licenci a další údaje doplníš po nahrání.">
          <input name="credit" className={input} placeholder="Foto: …" />
        </Field>
        <input type="hidden" name="license" value="unknown" />
        <button className="btn btn-dark">Nahrát</button>
      </ActionForm>

      {rows.length === 0 && <p className="text-muted">Zatím žádné fotky.</p>}
      <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
        {rows.map((m) => (
          <li key={m.id}>
            <Link href={`/admin/fotky/${m.id}`} className="block no-underline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${mediaUrl(m, { w: 640, ar: "4:5" })}&admin=1`} alt={m.alt ?? ""} className="block aspect-[4/5] w-full bg-bg-muted object-cover" loading="lazy" />
              <span className="mt-1 block truncate text-[14px] text-ink">{m.caption || m.alt || "bez popisu"}</span>
            </Link>
            <span className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
              {!isUsable(m) && <StatusBadge status="withdrawn" />}
              {LICENSES[m.license]} · {m.width}×{m.height}
              {m.width < 1200 && " · malá pro Discover"}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
