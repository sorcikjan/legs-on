import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/CtaBand";
import { PersonPlaceholder } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { getEpisodes } from "@/lib/episodes";
import { aboutLd } from "@/lib/jsonld";
import { CONTACT_EMAIL, STATS } from "@/lib/site";

export const metadata: Metadata = {
  title: "O nás – Petr a Honza",
  description:
    "Za mikrofonem LEGS:ON jsou Petr a Honza. Cyklistický podcast točíme od roku 2021: velké rozhovory a každý čtvrtek Espresso z pelotonu.",
  alternates: { canonical: "/o-nas" },
};

export default async function AboutPage() {
  const episodes = await getEpisodes();
  const maxNum = (series: string) => Math.max(0, ...episodes.filter((e) => e.series === series).map((e) => e.num));
  const stats = [
    { value: STATS.episodesTotal, label: "dílů" },
    { value: String(maxNum("Rozhovor")), label: "velkých rozhovorů" },
    { value: String(maxNum("Espresso")), label: "Espress" },
    { value: String(STATS.since), label: "šlapeme od" },
  ];
  const mail = CONTACT_EMAIL.includes("@") ? `mailto:${CONTACT_EMAIL}` : "#";

  return (
    <>
      <JsonLd data={aboutLd()} />
      <section className="wrap pb-14 pt-8 md:pb-[88px] md:pt-14">
        <h1 className="display m-0 text-[64px] leading-[0.88] md:text-[clamp(80px,11vw,168px)]">
          Ciao, jsme
          <br />
          Petr a Honza.
        </h1>
        <p className="m-0 mt-7 max-w-[640px] text-lg md:text-[21px]">
          Baví nás cyklistika natolik, že jsme se rozhodli přispět do mediálního prostoru rozhovory s lidmi, kteří to mají s
          láskou k tomuhle sportu stejně jako my.
        </p>
      </section>

      <section className="wrap grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {["Petr", "Honza"].map((name) => (
          <div key={name}>
            <div className="aspect-[4/5]">
              <PersonPlaceholder label={`Foto: ${name}`} iconSize={88} />
            </div>
            <h2 className="display m-0 mt-5 text-[44px] leading-none md:text-[56px]">{name}</h2>
            <p className="m-0 mt-2 max-w-[480px]">[Kdo je, jak se dostal k cyklistice, na čem jezdí.]</p>
          </div>
        ))}
      </section>

      <section className="mt-20 bg-bg-light md:mt-28">
        <div className="wrap flex flex-wrap gap-x-24 gap-y-8 py-16 md:py-28">
          <h2 className="display m-0 flex-[1_1_320px] text-5xl leading-[0.95] md:text-[64px]">Jak to začalo</h2>
          <div className="min-w-0 flex-[999_1_560px] leading-[1.7] md:text-[19px]">
            <p className="m-0">První díl vyšel v březnu 2021. [Doplnit: proč jste začali, první host, co se od té doby změnilo.]</p>
            <p className="m-0 mt-5">
              Dnes máme přes 150 dílů ve dvou formátech: velké rozhovory s lidmi, kteří cyklistikou žijí, a týdenní Espresso o
              dění v pelotonu.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap grid grid-cols-2 gap-8 py-16 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:py-24">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="display m-0 text-[56px] leading-none md:text-[80px]">{s.value}</p>
            <p className="m-0 mt-1 text-sm font-medium uppercase tracking-[1.5px]">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="wrap grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 pb-20 md:pb-28">
        <Link href="/dily" className="flex min-h-[260px] flex-col justify-between gap-3 bg-accent p-8 no-underline md:p-10">
          <p className="display m-0 text-5xl leading-none">Rozhovor</p>
          <p className="m-0">Jeden host, žádnej spěch. Olympionici, šéfové týmů i dlouholetí posluchači.</p>
          <span className="eyebrow text-sm">Všechny rozhovory →</span>
        </Link>
        <Link href="/dily" className="on-dark flex min-h-[260px] flex-col justify-between gap-3 bg-ink p-8 text-bg no-underline md:p-10">
          <p className="display m-0 text-5xl leading-none">Espresso</p>
          <p className="m-0 text-on-dark-muted">
            Každý čtvrtek půl hodiny o tom, co se děje v pelotonu. Tak šlapej těma nohama a jedem!!!
          </p>
          <span className="eyebrow text-sm">Všechna espressa →</span>
        </Link>
      </section>

      <section className="bg-bg-muted">
        <div className="wrap flex flex-wrap items-end justify-between gap-x-16 gap-y-8 py-16 md:py-[88px]">
          <div className="min-w-0 flex-[1_1_520px]">
            <h2 className="display m-0 text-5xl leading-[0.95] md:text-[56px]">Napiš nám</h2>
            <p className="m-0 mt-3 text-lg">Tip na hosta, zpětná vazba nebo spolupráce. {CONTACT_EMAIL}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={mail} className="btn btn-dark">
              {CONTACT_EMAIL}
            </a>
            <Link href="/pro-partnery" className="btn btn-outline">
              Pro partnery
            </Link>
          </div>
        </div>
      </section>

      <CtaBand placement="o-nas-band" />
    </>
  );
}
