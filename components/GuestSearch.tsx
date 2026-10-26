"use client";

import { useState, type ReactNode } from "react";

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const PAGE = 8;

/** Hledání a stránkování v mřížce hostů; karty se renderují na serveru. */
export function GuestSearch({ items, cards }: { items: { slug: string; search: string }[]; cards: Record<string, ReactNode> }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const q = fold(query.trim());
  const visible = items.filter((i) => !q || i.search.includes(q));

  return (
    <>
      <section className="wrap flex flex-wrap items-end justify-between gap-x-16 gap-y-6 pb-10 pt-8 md:pb-16 md:pt-14">
        <div className="min-w-0 flex-[999_1_560px]">
          <h1 className="display m-0 text-[64px] leading-[0.9] md:text-[clamp(72px,9vw,128px)]">Hosté</h1>
          <p className="m-0 mt-5 max-w-[560px] md:text-[19px]">
            Olympionici, šéfové týmů, vítězové etapáků i lidi, které cyklistika prostě chytla. U každého najdeš všechny díly a články.
          </p>
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
          <label htmlFor="hledat-hosta" className="eyebrow">
            Hledat hosta
          </label>
          <input
            id="hledat-hosta"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jméno nebo disciplína"
            className="field"
          />
        </div>
      </section>
      <section className="bg-bg-light">
        <div className="wrap pb-16 pt-12 md:pb-24 md:pt-[72px]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] md:gap-x-6 md:gap-y-10" aria-live="polite">
            {visible.slice(0, shown).map((i) => (
              <div key={i.slug}>{cards[i.slug]}</div>
            ))}
          </div>
          {visible.length === 0 && <p className="m-0 text-muted">Takového hosta jsme zatím neměli. Máš tip? Napiš nám.</p>}
          {shown < visible.length && (
            <div className="mt-14 text-center">
              <button type="button" onClick={() => setShown((s) => s + PAGE)} className="btn btn-outline py-4">
                Další hosté
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
