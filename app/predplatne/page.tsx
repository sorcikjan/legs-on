import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { Faq } from "@/components/Interactive";
import { HeroheroLink } from "@/components/TrackedLink";
import { getEpisodes } from "@/lib/episodes";
import { heroheroUrl, PRICE, STATS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Předplatné – šlapej s námi",
  description:
    "Podpoř cyklistický podcast LEGS:ON předplatným na Herohero. Díky předplatitelům vznikají další rozhovory, Espressa i články.",
  alternates: { canonical: "/predplatne" },
};

const FAQ = [
  {
    q: "Co je Herohero?",
    a: "Česká platforma, přes kterou můžeš přímo podporovat tvůrce a dostávat od nich obsah pro předplatitele. LEGS:ON tam má svou stránku.",
  },
  { q: "Kolik to stojí?", a: `${PRICE} měsíčně. [Doplnit případné další úrovně.]` },
  { q: "Můžu předplatné zrušit?", a: "[Doplnit podle podmínek Herohero.]" },
  {
    q: "Přijdu bez předplatného o díly?",
    a: "Ne. Rozhovory i Espresso zůstávají zdarma na všech platformách. Předplatné je podpora navíc.",
  },
];

const BENEFITS = [
  { title: "[Benefit 1]", text: "[Jednou větou, co přesně předplatitel dostane a jak často.]" },
  { title: "[Benefit 2]", text: "[Popis.]" },
  {
    title: "Dobrý pocit, že LEGS:ON jede dál",
    text: "Každé předplatné jde na techniku, hosty a čas, který do podcastu dáváme.",
  },
];

export default async function SubscribePage() {
  const episodes = await getEpisodes();
  const interviews = Math.max(0, ...episodes.filter((e) => e.series === "Rozhovor").map((e) => e.num));
  const stats = [
    { value: STATS.episodesTotal, label: `dílů od roku ${STATS.since}` },
    { value: String(interviews), label: "velkých rozhovorů" },
    { value: "1× týdně", label: "nové Espresso" },
    { value: "[XX]", label: "předplatitelů už šlape s námi" },
  ];

  return (
    <>
      <div className="on-dark bg-ink text-bg">
        <section className="wrap flex flex-wrap items-end gap-14 pb-16 pt-10 md:pb-28 md:pt-[72px]">
          <div className="min-w-0 flex-[999_1_640px]">
            <p className="eyebrow m-0 mb-8 tracking-[2px] text-accent md:mb-10 md:text-[15px]">Předplatné LEGS:ON</p>
            <h1 className="display m-0 text-[80px] leading-[0.86] md:text-[clamp(88px,12vw,180px)]">
              Šlapej
              <br />
              s námi.
            </h1>
            <p className="m-0 mt-7 max-w-[560px] text-lg text-on-dark-muted md:text-[21px]">
              Přes 150 dílů jsme natočili z lásky k cyklistice. S tvojí podporou jich natočíme další stovky.
            </p>
          </div>
          <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 bg-bg p-7 text-ink md:p-9">
            <p className="m-0 text-sm font-semibold uppercase tracking-[1.5px]">Měsíční předplatné</p>
            <p className="display m-0 text-[56px] normal-case leading-none md:text-[72px]">
              {PRICE}
              <span className="font-sans text-lg text-muted"> / měsíc</span>
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-base">
              {["[Benefit 1 – např. bonusové díly]", "[Benefit 2]", "[Benefit 3]"].map((b) => (
                <li key={b} className="flex gap-2.5">
                  <CheckIcon />
                  {b}
                </li>
              ))}
            </ul>
            <HeroheroLink href={heroheroUrl("predplatne-hero")} placement="predplatne-hero" className="btn btn-accent mt-2 py-5 text-base">
              Předplatit na Herohero
            </HeroheroLink>
            <p className="m-0 text-center text-[13px] text-muted">Platba i poslech probíhají přes Herohero.</p>
          </div>
        </section>
      </div>

      <section className="wrap py-16 md:py-28">
        <h2 className="display m-0 mb-10 text-5xl leading-[0.9] md:mb-12 md:text-[80px]">Co dostaneš</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="flex min-h-[260px] flex-col gap-3.5 bg-bg-light p-8 md:p-9">
              {/* Tmavší karamel kvůli kontrastu číslice na světlém pozadí */}
              <p className="display m-0 text-[56px] leading-none text-[#9A6236]">0{i + 1}</p>
              <h3 className="m-0 text-2xl font-medium leading-[1.25]">{b.title}</h3>
              <p className="m-0 text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-accent">
        <div className="wrap grid grid-cols-2 gap-8 py-16 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:py-24">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="display m-0 text-[48px] leading-none md:text-[80px]">{s.value}</p>
              <p className="eyebrow m-0 mt-1 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap py-16 md:py-28">
        <h2 className="display m-0 mb-10 text-5xl leading-[0.9] md:mb-12 md:text-[80px]">Jak to funguje</h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-10 p-0">
          {[
            ["Klikni na Předplatit", "Přesměrujeme tě na naši stránku na Herohero."],
            ["Zaregistruj se a zaplať", "Účet na Herohero založíš během chvilky."],
            ["Poslouchej", "Obsah pro předplatitele najdeš na webu nebo v aplikaci Herohero."],
          ].map(([title, text], i) => (
            <li key={title} className="border-t-[1.5px] border-ink pt-6">
              <p className="display m-0 text-[40px] leading-none">{i + 1}</p>
              <p className="m-0 mt-3 text-xl font-medium">{title}</p>
              <p className="m-0 mt-1.5 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-bg-light">
        <div className="mx-auto max-w-[920px] px-4 py-16 md:px-8 md:py-28">
          <h2 className="display m-0 mb-8 text-[44px] leading-[0.95] md:text-[64px]">Časté otázky</h2>
          <Faq items={FAQ} />
        </div>
      </section>

      <section className="on-dark bg-ink text-bg">
        <div className="wrap flex flex-wrap items-end justify-between gap-10 py-16 md:py-28">
          <div className="min-w-0 flex-[1_1_560px]">
            <h2 className="display m-0 text-[56px] leading-[0.9] md:text-[clamp(56px,8vw,120px)]">
              Tak šlapej
              <br />
              těma nohama.
            </h2>
            <p className="m-0 mt-4 text-lg text-on-dark-muted">A jedem!!!</p>
          </div>
          <div className="flex flex-[0_1_380px] flex-col gap-3">
            <HeroheroLink href={heroheroUrl("predplatne-band")} placement="predplatne-band" className="btn btn-accent px-8 py-5 text-base">
              Předplatit na Herohero
            </HeroheroLink>
            <Link href="/clanky#newsletter" className="py-2 text-center text-sm text-on-dark-muted">
              Zatím ne, jen newsletter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
