"use client";

import { useActionState } from "react";
import { saveArticle, type FormState } from "@/app/admin/clanky/actions";
import { MediaDatalist } from "@/components/admin/MediaDatalist";
import { Field, input, Notice } from "@/components/admin/ui";
import type { AdminArticle } from "@/lib/admin/articles";

type Options = {
  media: { url: string; label: string }[];
  topics: { id: number; name: string }[];
  episodes: { guid: string; series: string; num: number | null; title: string; day: string }[];
  people: { id: number; name: string; published: number }[];
};

const episodeLabel = (e: Options["episodes"][number]) =>
  `${e.series}${e.num ? ` #${e.series === "Espresso" ? String(e.num).padStart(3, "0") : e.num}` : ""} · ${e.title} (${e.day})`;

export function ArticleForm({ article, options, publishedAtLocal }: { article: AdminArticle | null; options: Options; publishedAtLocal: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveArticle, undefined);
  const a = article;
  const live = a?.status === "published";

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="flex flex-col gap-5">
        {state?.error && <Notice kind="error">{state.error}</Notice>}
        <Field label="Titulek">
          <input name="title" required defaultValue={a?.title} className={`${input} text-[20px] font-semibold`} />
        </Field>
        <Field label="Perex" hint="Jedna až dvě věty pod titulkem. Ukazuje se i ve výpisech a v Googlu.">
          <textarea name="perex" rows={3} defaultValue={a?.perex ?? ""} className={input} />
        </Field>
        <Field
          label="Text"
          hint={
            <>
              Odstavce odděl prázdným řádkem. <code>## Mezititulek</code>, citace <code>&gt; text</code> a pod ní{" "}
              <code>&gt; — autor</code>. Řádek <code>::prehravac</code> vloží přehrávač dílu, <code>::predplatne</code> pozvánku k předplatnému.
            </>
          }
        >
          <textarea name="body_md" rows={22} defaultValue={a?.body_md ?? "\n\n::prehravac\n\n::predplatne"} className={`${input} font-mono text-[14px] leading-relaxed`} />
        </Field>
        <details className="border border-line bg-white p-4">
          <summary className="cursor-pointer font-semibold">SEO a pokročilé</summary>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Titulek pro Google" hint="Když je prázdný, použije se titulek.">
              <input name="seo_title" defaultValue={a?.seo_title ?? ""} className={input} />
            </Field>
            <Field label="Popis pro Google" hint="Když je prázdný, použije se perex.">
              <textarea name="seo_description" rows={2} defaultValue={a?.seo_description ?? ""} className={input} />
            </Field>
            <Field label="Doba čtení (min)" hint="Prázdné = spočítá se z textu.">
              <input name="minutes" type="number" min={1} defaultValue={a?.minutes ?? ""} className={`${input} w-28`} />
            </Field>
            <Field label="Na homepage" hint="Pořadí mezi vybranými články (1 = hlavní), 0 = ne.">
              <input name="featured" type="number" min={0} defaultValue={a?.featured ?? 0} className={`${input} w-28`} />
            </Field>
            <label className="flex items-center gap-2 text-[15px]">
              <input type="checkbox" name="noindex" defaultChecked={!!a?.noindex} /> Neindexovat v Googlu
            </label>
          </div>
        </details>
      </div>

      <aside className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 border border-ink bg-white p-4">
          {a?.deleted_at ? null : live ? (
            <>
              <button name="intent" value="save" disabled={pending} className="btn btn-dark w-full">Uložit (změna hned na webu)</button>
              <label className="flex items-center gap-2 text-[14px]">
                <input type="checkbox" name="substantial" /> Podstatná úprava (ukázat „upraveno“)
              </label>
              <button name="intent" value="withdraw" disabled={pending} className="btn btn-outline w-full">Stáhnout z webu</button>
            </>
          ) : (
            <>
              <button name="intent" value="publish" disabled={pending} className="btn btn-dark w-full">Schválit a zveřejnit</button>
              <button name="intent" value="save" disabled={pending} className="btn btn-outline w-full">Uložit koncept</button>
            </>
          )}
          {a && !a.deleted_at && (
            <button
              name="intent"
              value="delete"
              disabled={pending}
              className="mt-2 text-left text-[14px] text-muted underline"
              onClick={(e) => !confirm("Smazat článek? Půjde obnovit.") && e.preventDefault()}
            >
              Smazat
            </button>
          )}
          {a?.deleted_at && (
            <button name="intent" value="restore" disabled={pending} className="btn btn-outline w-full">Obnovit</button>
          )}
        </div>

        <Field label="Zveřejnit od" hint="Prázdné = hned. Datum v budoucnu článek naplánuje.">
          <input name="published_at" type="datetime-local" defaultValue={publishedAtLocal} className={input} />
        </Field>
        <Field label="Adresa" hint={a ? undefined : "Prázdné = vytvoří se z titulku."}>
          <div className="flex items-center gap-1 text-[14px] text-muted">
            /clanky/
            <input name="slug" defaultValue={a?.slug ?? ""} className={input} pattern="[a-z0-9]+(-[a-z0-9]+)*" />
          </div>
        </Field>
        {live && (
          <label className="-mt-3 flex items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" name="confirm_slug" /> Změnit adresu (stará bude přesměrovaná)
          </label>
        )}
        <Field label="Hlavní téma">
          <select name="primary_tag_id" defaultValue={a?.primary_tag_id ?? ""} className={input}>
            <option value="">—</option>
            {options.topics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
          <legend className="mb-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted">Další témata</legend>
          {options.topics.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-[15px]">
              <input type="checkbox" name="tag_ids" value={t.id} defaultChecked={a?.tag_ids.includes(t.id)} /> {t.name}
            </label>
          ))}
        </fieldset>
        <Field label="Díl" hint="Přehrávač v článku a odkaz „Z rozhovoru…“.">
          <select name="episode_guid" defaultValue={a?.episode_guid ?? ""} className={input}>
            <option value="">—</option>
            {options.episodes.map((e) => (
              <option key={e.guid} value={e.guid}>{episodeLabel(e)}</option>
            ))}
          </select>
        </Field>
        <Field label="Hosté" hint="Cmd/Ctrl + klik pro víc hostů. * = profil není zveřejněný.">
          <select name="guest_ids" multiple size={8} defaultValue={a?.guest_ids.map(String)} className={input}>
            {options.people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.published ? "" : " *"}</option>
            ))}
          </select>
        </Field>
        <Field label="Fotka" hint="Začni psát a vyber z knihovny fotek (nebo cesta k souboru /images/…).">
          <input name="image_url" list="media-list" defaultValue={a?.image_url ?? ""} className={input} />
          <MediaDatalist media={options.media} />
        </Field>
        <Field label="Popis fotky (alt)">
          <input name="image_alt" defaultValue={a?.image_alt ?? ""} className={input} />
        </Field>
      </aside>
    </form>
  );
}
