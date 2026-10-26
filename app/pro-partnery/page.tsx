import type { Metadata } from "next";
import { PartnerForm } from "@/components/Interactive";
import { CONTACT_EMAIL, CONTACT_PHONE, STATS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pro partnery – reklama v cyklistickém podcastu",
  description:
    "Spolupráce s podcastem LEGS:ON: partnerství Espressa, rozhovoru nebo obsah na webu. Media kit, čísla o publiku a poptávkový formulář.",
  alternates: { canonical: "/pro-partnery" },
};

const FORMATS = [
  {
    name: "Partner Espressa",
    desc: "Zmínka v týdenním Espressu a logo u dílu na webu. Pravidelný kontakt s publikem každý týden.",
    price: "[cena / měsíc]",
  },
  {
    name: "Partner rozhovoru",
    desc: "Prezentace v dlouhém rozhovoru, odkaz v popisu dílu, na webu i v článku z dílu.",
    price: "[cena / díl]",
  },
  {
    name: "Obsah na webu",
    desc: "Článek nebo test vybavení s jasným označením spolupráce. Zůstává ve vyhledávání dlouhodobě.",
    price: "[cena]",
  },
  { name: "Na míru", desc: "Vyjížďka s posluchači, živé natáčení na akci nebo série dílů.", price: "Domluvíme se" },
];

const STATS_ROW = [
  { value: STATS.episodesTotal, label: `dílů od roku ${STATS.since}` },
  { value: "[XX k]", label: "poslechů měsíčně" },
  { value: "[XX k]", label: "sledujících na sítích" },
  { value: "[XX %]", label: "doposlechne díl do konce" },
];

export default function PartnersPage() {
  return (
    <>
      <section className="md:wrap">
        <div className="flex flex-wrap">
          <div className="on-dark flex min-w-0 flex-[999_1_640px] flex-col justify-between gap-12 bg-ink px-4 py-10 text-bg md:min-h-[520px] md:px-10 md:py-14">
            <p className="eyebrow m-0 tracking-[2px] text-accent md:text-[15px]">Pro partnery</p>
            <div>
              <h1 className="display m-0 text-[52px] leading-[0.9] md:text-[clamp(64px,8vw,120px)]">
                Mluvte k lidem, kteří cyklistikou žijí.
              </h1>
              <p className="m-0 mt-6 max-w-[560px] text-lg text-on-dark-muted md:text-xl">
                Posluchači LEGS:ON s námi tráví půl hodiny až hodinu každý týden. Ne scrollováním, ale posloucháním.
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_360px] flex-col justify-end gap-4 bg-accent px-4 py-8 md:p-10">
            <p className="display m-0 text-[40px] leading-none">Media kit</p>
            <p className="m-0">Čísla, publikum, formáty a ceník v jednom PDF.</p>
            {/* [Doplnit PDF media kitu do /public] */}
            <a href="#" aria-disabled="true" className="btn btn-dark py-[18px]">
              Stáhnout media kit (PDF)
            </a>
          </div>
        </div>
      </section>

      <section className="wrap grid grid-cols-2 gap-8 py-16 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:py-24">
        {STATS_ROW.map((s) => (
          <div key={s.label}>
            <p className="display m-0 text-5xl leading-none md:text-[72px]">{s.value}</p>
            <p className="eyebrow m-0 mt-1 text-sm">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="bg-bg-light">
        <div className="wrap py-16 md:py-28">
          <h2 className="display m-0 mb-10 text-5xl leading-[0.9] md:mb-12 md:text-[80px]">Jak můžeme spolupracovat</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {FORMATS.map((f) => (
              <div key={f.name} className="flex min-h-[240px] flex-col gap-3 bg-bg p-8">
                <h3 className="display m-0 text-[32px] leading-none">{f.name}</h3>
                <p className="m-0 text-body">{f.desc}</p>
                <p className="eyebrow m-0 mt-auto text-sm">{f.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24">
        <h2 className="m-0 mb-8 text-sm font-semibold uppercase tracking-[2px] text-muted">S kým jsme už šlapali</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex h-24 items-center justify-center border border-dashed border-on-dark-subtle text-[13px] text-muted">
              [logo partnera]
            </div>
          ))}
        </div>
      </section>

      <section className="on-dark bg-ink text-bg">
        <div className="wrap flex flex-wrap gap-14 py-16 md:py-28">
          <div className="min-w-0 flex-[1_1_400px]">
            <h2 className="display m-0 text-[56px] leading-[0.9] md:text-[80px]">Ozvěte se</h2>
            <p className="m-0 mt-5 max-w-[420px] text-lg text-on-dark-muted">
              Napište, co chcete posluchačům říct, a navrhneme formát, který bude dávat smysl jim i vám.
            </p>
            <p className="m-0 mt-6 text-lg">
              {CONTACT_EMAIL} · {CONTACT_PHONE}
            </p>
          </div>
          <PartnerForm email={CONTACT_EMAIL} />
        </div>
      </section>
    </>
  );
}
