import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field, input, Notice, PageTitle, StatusBadge } from "@/components/admin/ui";
import { chaptersToText } from "@/lib/admin/chapters";
import { getAdminEpisode, guestOptions, seriesLabel } from "@/lib/admin/episodes";
import { pragueDateTime } from "@/lib/time";
import { saveEpisode } from "../actions";

const OK: Record<string, string> = { save: "Uloženo.", hide: "Díl je skrytý z webu.", show: "Díl je zase na webu." };

export default async function AdminEpisode({ params, searchParams }: PageProps<"/admin/dily/[guid]">) {
  const guid = decodeURIComponent((await params).guid);
  const ok = String((await searchParams).ok ?? "");
  const [e, people] = await Promise.all([getAdminEpisode(guid), guestOptions()]);
  if (!e) notFound();
  const live = e.status === "published";

  return (
    <>
      <p className="m-0 mb-2 text-[14px]">
        <Link href="/admin/dily">← Díly</Link>
      </p>
      <PageTitle actions={live ? <Link href={`/dily/${e.slug}`} target="_blank" className="btn btn-outline">Otevřít na webu ↗</Link> : undefined}>
        {seriesLabel(e.series, e.num)}
      </PageTitle>
      {OK[ok] && <Notice>{OK[ok]}</Notice>}
      <ActionForm action={saveEpisode} className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <input type="hidden" name="guid" value={e.guid} />
        <div className="flex flex-col gap-5">
          <div className="border border-line bg-white p-4">
            <p className="m-0 mb-1 text-[13px] font-semibold uppercase text-muted">Z RSS · vyšel {pragueDateTime(e.published_at)}</p>
            <p className="m-0 mb-2 text-[20px] font-semibold">{e.title}</p>
            <p className="m-0 whitespace-pre-line text-[15px] text-body">{e.description}</p>
            <p className="m-0 mt-2 text-[13px] text-muted">Adresa /dily/{e.slug} · název a popis se mění na Spotify, web je převezme sám.</p>
          </div>
          <Field label="Kapitoly" hint={<>Každá na řádek: <code>12:34 Název kapitoly</code>. Bez času jen název.</>}>
            <textarea name="chapters" rows={10} defaultValue={chaptersToText(e.chapters_json ? JSON.parse(e.chapters_json) : [])} className={`${input} font-mono text-[14px]`} />
          </Field>
        </div>
        <aside className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 border border-ink bg-white p-4">
            <p className="m-0 mb-1"><StatusBadge status={live ? "published" : "withdrawn"} /></p>
            <button name="intent" value="save" className="btn btn-dark w-full">Uložit</button>
            {live ? (
              <button name="intent" value="hide" className="btn btn-outline w-full">Skrýt z webu</button>
            ) : (
              <button name="intent" value="show" className="btn btn-outline w-full">Zobrazit na webu</button>
            )}
          </div>
          <Field label="Hosté" hint="Cmd/Ctrl + klik pro víc hostů. První je hlavní. * = profil není zveřejněný.">
            <select name="guest_ids" multiple size={10} defaultValue={e.guest_ids.map(String)} className={input}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.published ? "" : " *"}</option>
              ))}
            </select>
          </Field>
          <Field label="Fotka bez textu (adresa)" hint="Zatím cesta k souboru, např. /images/korinek.jpg. Knihovna fotek přijde.">
            <input name="image_url" defaultValue={e.image_url ?? ""} className={input} />
          </Field>
          {(e.image_url || e.cover_url) && (
            <Image src={e.image_url || e.cover_url!} alt="" width={320} height={320} className="h-auto w-full border border-line" />
          )}
          <label className="flex items-center gap-2 text-[15px]">
            <input type="checkbox" name="noindex" defaultChecked={!!e.noindex} /> Neindexovat v Googlu
          </label>
        </aside>
      </ActionForm>
    </>
  );
}
