"use client";

import { useState, type ReactNode } from "react";

type Item = { slug: string; series: string; search: string };

const FILTERS = [
  { label: "Vše", series: null },
  { label: "Rozhovory", series: "Rozhovor" },
  { label: "Espresso", series: "Espresso" },
] as const;

const PAGE = 8;

/**
 * Filtr, hledání a stránkování archivu. Řádky dílů se renderují na serveru
 * (rows), tady se jen vybírá, které jsou vidět.
 */
export function ArchiveList({
  items,
  rows,
  total,
  initialFilter = "Vše",
}: {
  items: Item[];
  rows: Record<string, ReactNode>;
  total: string;
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const series = FILTERS.find((f) => f.label === filter)?.series;
  const q = query.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const visible = items.filter((i) => (!series || i.series === series) && (!q || i.search.includes(q)));
  const page = visible.slice(0, shown);

  return (
    <>
      <section className="wrap flex flex-wrap items-end justify-between gap-x-16 gap-y-6 pb-10 pt-8 md:pb-16 md:pt-14">
        <div className="min-w-0 flex-[999_1_560px]">
          <h1 className="display m-0 text-[64px] leading-[0.9] md:text-[clamp(72px,9vw,128px)]">Všechny díly</h1>
          <p className="m-0 mt-5 max-w-[560px] md:text-[19px]">
            {total} dílů od roku 2021. Každý čtvrtek nové Espresso, k tomu velké rozhovory.
          </p>
        </div>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
          <label htmlFor="hledat" className="eyebrow">
            Hledat díl nebo hosta
          </label>
          <input
            id="hledat"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Např. Kořínek, gravel, Picnic…"
            className="field"
          />
        </div>
      </section>

      <section className="bg-bg-light">
        <div className="wrap pb-16 pt-10 md:pb-24 md:pt-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Typ dílu">
              {FILTERS.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  aria-pressed={filter === f.label}
                  onClick={() => {
                    setFilter(f.label);
                    setShown(PAGE);
                  }}
                  className="min-h-11 cursor-pointer border-[1.5px] border-ink bg-transparent px-[18px] py-2.5 font-sans text-sm font-medium uppercase tracking-[1px] text-ink aria-pressed:bg-ink aria-pressed:text-bg-light"
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="m-0 text-sm text-muted">Řazeno od nejnovějšího</p>
          </div>

          <div className="border-t-[1.5px] border-ink" aria-live="polite">
            {page.map((i) => (
              <div key={i.slug}>{rows[i.slug]}</div>
            ))}
            {page.length === 0 && <p className="m-0 border-b-[1.5px] border-ink py-6 text-muted">Nic jsme nenašli. Zkus jiné slovo.</p>}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="m-0 text-[15px] text-muted">
              Zobrazeno {page.length} z {series || q ? visible.length : total} dílů
            </p>
            {shown < visible.length && (
              <button type="button" onClick={() => setShown((s) => s + PAGE)} className="btn btn-outline py-4">
                Načíst starší díly
              </button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
