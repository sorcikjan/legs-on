import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, ConfirmButton } from "@/components/admin/ActionForm";
import { CopyButton, FocalPicker } from "@/components/admin/FocalPicker";
import { Field, input, Notice, PageTitle, StatusBadge } from "@/components/admin/ui";
import { getMedia } from "@/lib/admin/media";
import { isUsable, LICENSES, mediaUrl } from "@/lib/media";
import { isoToPragueLocal } from "@/lib/time";
import { saveMedia } from "../actions";

export default async function AdminMediaItem({ params, searchParams }: PageProps<"/admin/fotky/[id]">) {
  const { id } = await params;
  const ok = String((await searchParams).ok ?? "");
  const m = await getMedia(Number(id));
  if (!m || m.deleted_at) notFound();
  const url = mediaUrl(m);
  const version = `v=${m.focal_x ?? ""}-${m.focal_y ?? ""}`;

  return (
    <>
      <p className="m-0 mb-2 text-[14px]">
        <Link href="/admin/fotky">← Fotky</Link>
      </p>
      <PageTitle actions={<CopyButton value={url} />}>Fotka</PageTitle>
      {ok === "create" && <Notice>Nahráno. Doplň licenci, bez ní se fotka na webu nezobrazí.</Notice>}
      {ok === "save" && <Notice>Uloženo.</Notice>}
      <p className="m-0 mb-4 flex flex-wrap items-center gap-3 text-[14px] text-muted">
        <StatusBadge status={isUsable(m) ? "published" : "withdrawn"} />
        {isUsable(m) ? "Smí se použít na webu." : "Na webu se nezobrazí (licence, zákaz nebo propadlá platnost)."}
        <span>{m.width}×{m.height} px</span>
        {m.width < 1200 && <span>Menší než 1200 px: do Google Discover se nehodí.</span>}
        <code className="text-ink">{url}</code>
      </p>
      <ActionForm action={saveMedia} className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <input type="hidden" name="id" value={m.id} />
        <div className="flex flex-col gap-6">
          <FocalPicker src={`${url}?admin=1`} x={m.focal_x} y={m.focal_y} />
          <div>
            <p className="m-0 mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">Výřezy (po uložení)</p>
            <div className="grid grid-cols-[2fr_1fr_1fr] items-start gap-3">
              {(["16:9", "1:1", "4:5"] as const).map((ar) => (
                <figure key={ar} className="m-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${mediaUrl(m, { w: 640, ar })}&admin=1&${version}`} alt="" className="block h-auto w-full border border-line" />
                  <figcaption className="text-[12px] text-muted">{ar}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
        <aside className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 border border-ink bg-white p-4">
            <button name="intent" value="save" className="btn btn-dark w-full">Uložit</button>
            <ConfirmButton question="Smazat fotku? Zmizí ze všech míst, kde je použitá." name="intent" value="delete" className="mt-2 text-left text-[14px] text-muted underline">
              Smazat
            </ConfirmButton>
          </div>
          <Field label="Popis (alt)" hint="Co je na fotce.">
            <input name="alt" defaultValue={m.alt ?? ""} className={input} />
          </Field>
          <Field label="Popisek pod fotkou">
            <input name="caption" defaultValue={m.caption ?? ""} className={input} />
          </Field>
          <Field label="Autor / zdroj" hint="„Foto: Jan Novák / ČTK“">
            <input name="credit" defaultValue={m.credit ?? ""} className={input} />
          </Field>
          <Field label="Odkaz na autora">
            <input name="credit_url" type="url" defaultValue={m.credit_url ?? ""} className={input} />
          </Field>
          <Field label="Licence">
            <select name="license" defaultValue={m.license} className={input}>
              {Object.entries(LICENSES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Podmínky licence" hint="„Jen k článku o Tour 2026, ne na sociální sítě“">
            <textarea name="license_note" rows={2} defaultValue={m.license_note ?? ""} className={input} />
          </Field>
          <Field label="Licence platí do" hint="Po tomto dni se fotka na webu přestane zobrazovat.">
            <input name="license_expires_at" type="date" defaultValue={isoToPragueLocal(m.license_expires_at).slice(0, 10)} className={input} />
          </Field>
          <label className="flex items-center gap-2 text-[15px]">
            <input type="checkbox" name="web_allowed" defaultChecked={!!m.web_allowed} /> Smí se použít na webu
          </label>
        </aside>
      </ActionForm>
    </>
  );
}
