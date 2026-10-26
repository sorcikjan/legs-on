import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArticleGrid, FeaturedArticles, TopicPills, withSource } from "@/components/ArticleCard";
import { GuestNames, SectionLabel } from "@/components/bits";
import { EpisodeList } from "@/components/EpisodeRow";
import { PersonPlaceholder, PlayIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { SubscribeLink } from "@/components/TrackedLink";
import { getArticles, getGuests, TOPICS } from "@/lib/content";
import { getEpisodes, type Episode } from "@/lib/episodes";
import { shortDate } from "@/lib/format";
import { podcastSeriesLd } from "@/lib/jsonld";
import { PLATFORMS, PRICE, STATS } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "LEGS:ON – cyklistický podcast Petra a Honzy" },
  alternates: { canonical: "/" },
  openGraph: { images: ["/images/picnic.jpg"] },
};

/** Poslední věta titulku dílu se zvýrazní („… Jak dopadne Picnic?“). */
function SplitTitle({ title }: { title: string }) {
  const i = title.lastIndexOf(". ");
  if (i === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, i + 1)} <span className="text-accent-light">{title.slice(i + 2)}</span>
    </>
  );
}

function Spotlight({ latest, interview }: { latest: Episode; interview?: Episode }) {
  return (
    <div className="mb-6 flex flex-wrap gap-3 md:mb-10 md:gap-6">
      <Link
        href={`/dily/${latest.slug}`}
        className="on-dark relative flex min-h-[360px] min-w-0 flex-[999_1_640px] flex-col justify-end overflow-hidden bg-ink p-5 text-bg no-underline md:min-h-[480px] md:justify-between md:p-8"
      >
        {latest.image && (
          <Image
            src={latest.image}
            alt=""
            fill
            priority
            sizes="(min-width: 1320px) 860px, 100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.35)_0%,rgba(18,18,18,0.85)_70%)]" />
        <div className="relative flex items-center justify-between gap-4">
          <span className="bg-bg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-ink md:px-3 md:py-1.5 md:text-[13px]">
            Nový díl · {shortDate(latest.date)}
            <span className="md:hidden"> · {latest.series} {latest.label}</span>
          </span>
          <span className="display hidden text-[28px] leading-none md:inline">
            {latest.series} {latest.label}
          </span>
        </div>
        <div className="relative mt-3 md:mt-0">
          <h3 className="display m-0 max-w-[760px] text-[32px] leading-none md:text-[clamp(40px,4.5vw,64px)] md:leading-[0.98]">
            <SplitTitle title={latest.title} />
          </h3>
          <div className="mt-3 flex items-center gap-4 md:mt-6">
            <span className="hidden h-[60px] w-[60px] flex-none items-center justify-center rounded-full bg-accent text-ink md:flex" aria-hidden="true">
              <PlayIcon size={22} />
            </span>
            <span className="text-[13px] font-medium uppercase tracking-[1px] md:text-[15px]">
              <span className="md:hidden" aria-hidden="true">▶ </span>Přehrát · {latest.minutes} min
            </span>
          </div>
        </div>
      </Link>

      {interview && (
        <Link
          href={`/dily/${interview.slug}`}
          className="flex min-w-0 flex-[1_1_360px] flex-row bg-accent text-ink no-underline md:flex-col"
        >
          {interview.image && (
            <Image
              src={interview.image}
              alt={interview.guest ?? ""}
              width={406}
              height={640}
              sizes="(min-width: 768px) 420px, 110px"
              className="block w-[110px] flex-none bg-ink object-cover object-top md:h-[260px] md:w-full md:object-[center_20%]"
            />
          )}
          <div className="flex flex-1 flex-col gap-1.5 p-4 md:gap-2.5 md:px-7 md:pb-7 md:pt-6">
            <div className="flex justify-between gap-3 text-[11px] font-semibold uppercase tracking-[1.5px] md:text-[13px]">
              <span>
                {interview.series} {interview.label}
                <span className="md:hidden"> · {shortDate(interview.date)}</span>
              </span>
              <span className="hidden md:inline">{shortDate(interview.date)}</span>
            </div>
            <h3 className="display m-0 text-[22px] leading-[1.05] md:text-[34px] md:leading-[1.02]">{interview.title}</h3>
            <p className="m-0 mt-auto hidden text-[15px] font-medium md:block">
              {interview.guest} · {interview.minutes} min
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [episodes, articles, guests] = await Promise.all([getEpisodes(), getArticles(), getGuests()]);
  const latest = episodes[0];
  const interview = episodes.find((e) => e.series === "Rozhovor" && e.slug !== latest.slug);
  const rest = episodes.filter((e) => e !== latest && e !== interview).slice(0, 6);

  const all = withSource(articles, guests);
  const featured = all.filter((a) => a.featured > 0).sort((a, b) => a.featured - b.featured);
  const grid = all.filter((a) => !featured.includes(a)).slice(0, 8);

  const listen = [
    { label: "Spotify", short: "Spotify", href: PLATFORMS.spotify },
    { label: "Apple Podcasts", short: "Apple", href: PLATFORMS.apple },
    { label: "YouTube", short: "YouTube", href: PLATFORMS.youtube },
  ];

  return (
    <>
      <JsonLd data={podcastSeriesLd()} />

      {/* 1 · Úvod */}
      <section className="md:wrap md:pt-2">
        <div className="flex flex-wrap">
          <div className="flex min-w-0 flex-[999_1_640px] flex-col justify-end gap-8 bg-accent px-4 pb-8 pt-10 md:min-h-[520px] md:px-10 md:py-14">
            <h1 className="display m-0 text-[76px] leading-[0.88] md:text-[clamp(80px,11vw,168px)]">
              Šlapej
              <br />
              těma
              <br />
              nohama.
            </h1>
            <p className="m-0 max-w-[520px] md:text-xl">
              Cyklistický podcast Petra a Honzy. Rozhovory s lidmi, kteří cyklistikou žijí, a každý týden Espresso z
              pelotonu.
            </p>
          </div>
          <div className="on-dark flex min-w-0 flex-[1_1_360px] flex-col justify-end bg-ink px-4 pb-6 pt-5 text-bg md:p-10">
            <p className="m-0 mb-2 text-xs font-medium uppercase tracking-[2px] text-on-dark-subtle md:mb-3 md:text-sm">
              Poslouchej
            </p>
            {/* Desktop: řádky, mobil: mřížka 2×2 */}
            <div className="grid grid-cols-2 gap-2 md:flex md:flex-col md:gap-0">
              {listen.map((p) => (
                <a
                  key={p.label}
                  href={p.href}
                  className="display flex justify-between border border-dark-line px-3 py-3.5 text-[22px] leading-none text-bg no-underline md:border-0 md:border-t md:px-0 md:text-[34px]"
                >
                  <span className="md:hidden">{p.short}</span>
                  <span className="hidden md:inline">{p.label}</span>
                  <span aria-hidden="true" className="hidden md:inline">→</span>
                </a>
              ))}
              <SubscribeLink
                placement="home-listen"
                className="display flex justify-between border border-dark-line px-3 py-3.5 text-[22px] leading-none text-accent no-underline md:border-0 md:border-t md:px-0 md:text-[34px]"
              >
                Herohero <span aria-hidden="true" className="hidden md:inline">→</span>
              </SubscribeLink>
            </div>
          </div>
        </div>
      </section>

      {/* 2 · Poslední díly */}
      <section className="mt-12 bg-bg-light md:mt-24">
        <div className="wrap py-12 md:py-28">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-7">
            <div>
              <h2 className="display m-0 text-5xl leading-[0.95] md:text-[80px] md:leading-[0.9]">Poslední díly</h2>
              <p className="m-0 mt-2 text-[15px] text-body md:mt-3 md:text-[17px]">
                Každý čtvrtek nové Espresso, k tomu velké rozhovory.
              </p>
            </div>
            <Link href="/dily" className="eyebrow hidden py-2 text-[15px] md:inline-block">
              Všech {STATS.episodesTotal} dílů →
            </Link>
          </div>
          <Spotlight latest={latest} interview={interview} />
          <EpisodeList episodes={rest} />
          <Link href="/dily" className="btn btn-outline mt-5 w-full text-sm md:hidden">
            Všech {STATS.episodesTotal} dílů
          </Link>
        </div>
      </section>

      {/* 3 · O nás */}
      <section className="bg-bg-muted">
        <div className="wrap flex flex-col-reverse gap-6 py-12 md:flex-row md:flex-wrap md:items-center md:gap-12 md:py-28">
          <div className="grid min-w-0 flex-[999_1_560px] grid-cols-2 gap-2.5 md:gap-5">
            {["Petr", "Honza"].map((name) => (
              <div key={name}>
                <div className="aspect-[3/4]">
                  <PersonPlaceholder label={`Foto: ${name}`} />
                </div>
                <p className="display m-0 mt-2 text-2xl leading-none md:mt-3.5 md:text-[40px]">{name}</p>
                <p className="m-0 mt-1 text-sm md:text-[15px]">[Na čem jezdí]</p>
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-[1_1_400px]">
            <p className="m-0 mb-3 text-xs font-semibold uppercase tracking-[2px] md:mb-4 md:text-sm">Za mikrofonem</p>
            <h2 className="display m-0 text-[52px] leading-[0.9] md:text-[88px]">
              Ciao, jsme
              <br />
              Petr a Honza.
            </h2>
            <p className="m-0 mt-4 max-w-[460px] md:mt-6 md:text-lg">
              Baví nás cyklistika natolik, že o ní od roku {STATS.since} točíme podcast. Přes 150 dílů a pořád nás to
              nepustilo.
            </p>
            <Link href="/o-nas" className="btn btn-dark mt-4 md:mt-7">
              Náš příběh →
            </Link>
          </div>
        </div>
      </section>

      {/* 4 · Články (SEO) */}
      <section className="bg-bg-light">
        <div className="wrap py-14 md:py-36">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
            <div>
              <h2 className="m-0 text-[34px] font-medium leading-[1.1] tracking-[-0.5px] md:text-5xl md:tracking-[-1px]">
                Články
              </h2>
              <p className="m-0 mt-1.5 max-w-[520px] text-[15px] text-muted md:mt-2.5 md:text-[17px]">
                Z každého dílu vzniká článek. Přečti si to podstatné, a když tě to chytne, pusť si celý díl.
              </p>
            </div>
            <Link href="/clanky" className="hidden py-2 text-[15px] font-medium md:inline-block">
              Všechny články →
            </Link>
          </div>
          <div className="mb-8 hidden md:mb-12 md:block">
            <TopicPills topics={TOPICS} />
          </div>
          {featured[0] && <FeaturedArticles main={featured[0]} side={featured[1]} />}
          <div className="mt-10 md:mt-[72px]">
            <ArticleGrid articles={grid} />
          </div>
          <div className="mt-10 text-center md:mt-16">
            <Link href="/clanky" className="pill px-7 py-3.5 text-[15px] font-medium">
              Další články
            </Link>
          </div>
        </div>
      </section>

      {/* 5 · Hosté */}
      <section className="wrap py-10 md:py-[72px]">
        <SectionLabel>U mikrofonu byli</SectionLabel>
        <GuestNames guests={guests} moreHref="/hoste" moreLabel="a další →" />
      </section>

      {/* 6 · Předplatné */}
      <section className="on-dark bg-ink text-bg">
        <div className="wrap flex flex-wrap items-end justify-between gap-5 py-14 md:gap-12 md:py-28">
          <div className="min-w-0 flex-[1_1_560px]">
            <h2 className="display m-0 text-[64px] leading-[0.9] md:text-[clamp(64px,8vw,120px)]">
              Šlapej
              <br />
              s námi.
            </h2>
            <p className="m-0 mt-3.5 max-w-[520px] text-on-dark-muted md:mt-5 md:text-[19px]">
              Předplatitelé na Herohero drží LEGS:ON v sedle. [Co předplatitelé dostávají.]
            </p>
          </div>
          <div className="flex min-w-0 flex-[0_1_380px] flex-col gap-4">
            <p className="display m-0 text-[40px] normal-case leading-none md:text-[56px]">
              {PRICE} <span className="font-sans text-[15px] text-on-dark-muted md:text-lg">/ měsíc</span>
            </p>
            <SubscribeLink placement="home-band" className="btn btn-accent py-5 text-base">
              Předplatit na Herohero
            </SubscribeLink>
            <Link href="/clanky#newsletter" className="py-2 text-center text-sm text-on-dark-muted">
              Zatím jen newsletter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
