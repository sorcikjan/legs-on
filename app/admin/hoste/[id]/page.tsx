import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton } from "@/components/admin/ActionForm";
import { Field, input, Notice, PageTitle, StatusBadge } from "@/components/admin/ui";
import { seriesLabel } from "@/lib/admin/episodes";
import { getAdminPerson } from "@/lib/admin/people";
import { savePerson } from "../actions";

const OK: Record<string, string> = {
  save: "Uloženo.",
  create: "Host je založený.",
  publish: "Profil je zveřejněný.",
  unpublish: "Profil je skrytý.",
  delete: "Host je smazaný. Jde obnovit.",
  restore: "Host je obnovený.",
};

export default async function AdminGuest({ params, searchParams }: PageProps<"/admin/hoste/[id]">) {
  const { id } = await params;
  const ok = String((await searchParams).ok ?? "");
  const isNew = id === "novy";
  const p = isNew ? null : await getAdminPerson(Number(id));
  if (!isNew && !p) notFound();
  const live = !!p?.published_at;
  const sameAs: string[] = p?.same_as_json ? JSON.parse(p.same_as_json) : [];

  return (
    <>
      <p className="m-0 mb-2 text-[14px]">
        <Link href="/admin/hoste">← Hosté</Link>
      </p>
      <PageTitle actions={live && !p?.deleted_at ? <Link href={`/hoste/${p!.slug}`} target="_blank" className="btn btn-outline">Otevřít na webu ↗</Link> : undefined}>
        {p?.name ?? "Nový host"}
      </PageTitle>
      {OK[ok] && <Notice>{OK[ok]}</Notice>}
      <ActionForm action={savePerson} className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {p && <input type="hidden" name="id" value={p.id} />}
        <div className="flex flex-col gap-5">
          <Field label="Jméno">
            <input name="name" required defaultValue={p?.name} className={`${input} text-[20px] font-semibold`} />
          </Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="S kým (7. pád)" hint="„Rozhovor se Zdeňkem Štybarem“">
              <input name="name_instrumental" defaultValue={p?.name_instrumental ?? ""} className={input} />
            </Field>
            <Field label="Krátce (7. pád)" hint="„Díly se Zdeňkem“">
              <input name="name_with_short" defaultValue={p?.name_with_short ?? ""} className={input} />
            </Field>
            <Field label="Role" hint="„cyklokrosař, mistr světa“">
              <input name="role" defaultValue={p?.role ?? ""} className={input} />
            </Field>
            <Field label="Disciplína">
              <input name="discipline" defaultValue={p?.discipline ?? ""} className={input} />
            </Field>
            <Field label="Tým">
              <input name="team" defaultValue={p?.team ?? ""} className={input} />
            </Field>
            <Field label="Pořadí ve výpisu" hint="Menší = výš. Prázdné = na konec.">
              <input name="sort_order" type="number" defaultValue={p?.sort_order ?? ""} className={input} />
            </Field>
          </div>
          <Field label="Bio" hint="Odstavce odděl prázdným řádkem.">
            <textarea name="bio_md" rows={8} defaultValue={p?.bio_md ?? ""} className={input} />
          </Field>
          <Field label="Odkazy" hint="Instagram, Wikipedie, ProCyclingStats… každý na řádek. Pomáhají Googlu poznat, o koho jde.">
            <textarea name="same_as" rows={3} defaultValue={sameAs.join("\n")} className={`${input} font-mono text-[14px]`} />
          </Field>
          {p && p.episodes.length > 0 && (
            <div>
              <p className="m-0 mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Díly (z vazeb u dílů)</p>
              <ul className="m-0 pl-5 text-[15px]">
                {p.episodes.map((e) => (
                  <li key={e.guid}>
                    <Link href={`/admin/dily/${encodeURIComponent(e.guid)}`}>{seriesLabel(e.series, e.num)}</Link> · {e.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <aside className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 border border-ink bg-white p-4">
            {p && <p className="m-0 mb-1"><StatusBadge status={p.deleted_at ? "deleted" : live ? "published" : "draft"} /></p>}
            {p?.deleted_at ? (
              <button name="intent" value="restore" className="btn btn-dark w-full">Obnovit</button>
            ) : (
              <>
                {live ? (
                  <>
                    <button name="intent" value="save" className="btn btn-dark w-full">Uložit</button>
                    <button name="intent" value="unpublish" className="btn btn-outline w-full">Skrýt profil</button>
                  </>
                ) : (
                  <>
                    <button name="intent" value="publish" className="btn btn-dark w-full">Zveřejnit profil</button>
                    <button name="intent" value="save" className="btn btn-outline w-full">Uložit koncept</button>
                  </>
                )}
                {p && (
                  <ConfirmButton question="Smazat hosta? Půjde obnovit." name="intent" value="delete" className="mt-2 text-left text-[14px] text-muted underline">
                    Smazat
                  </ConfirmButton>
                )}
              </>
            )}
          </div>
          <Field label="Adresa" hint={p ? undefined : "Prázdné = vytvoří se ze jména."}>
            <div className="flex items-center gap-1 text-[14px] text-muted">
              /hoste/
              <input name="slug" defaultValue={p?.slug ?? ""} className={input} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
            </div>
          </Field>
          {live && (
            <label className="-mt-3 flex items-center gap-2 text-[13px] text-muted">
              <input type="checkbox" name="confirm_slug" /> Změnit adresu (stará bude přesměrovaná)
            </label>
          )}
          <Field label="Fotka (adresa)" hint="Zatím cesta k souboru, např. /images/stastny.jpg. Knihovna fotek přijde.">
            <input name="photo_url" defaultValue={p?.photo_url ?? ""} className={input} />
          </Field>
          {p?.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo_url} alt="" className="h-auto w-full border border-line" />
          )}
        </aside>
      </ActionForm>
    </>
  );
}
