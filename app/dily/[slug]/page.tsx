import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard, withSource } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/bits";
import { CtaBand } from "@/components/CtaBand";
import { EpisodeList } from "@/components/EpisodeRow";
import { Collapsible, ShareButtons } from "@/components/Interactive";
import { JsonLd } from "@/components/JsonLd";
import { Chapters, EpisodePlayer } from "@/components/player/EpisodePlayer";
import { SubscribeLink } from "@/components/TrackedLink";
import { getArticles, getGuest, getGuests } from "@/lib/content";
import { episodeRef, getEpisode, getEpisodes, playable } from "@/lib/episodes";
import { longDate } from "@/lib/format";
import { podcastEpisodeLd } from "@/lib/jsonld";
import { PLATFORMS } from "@/lib/site";

export async function generateStaticParams() {
  return (await getEpisodes()).map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/dily/[slug]">): Promise<Metadata> {
  const episode = await getEpisode((await params).slug);
  if (!episode) return {};
  const title =
    episode.series === "Rozhovor" && episode.guest
      ? `${episode.guest}: ${episode.title} (rozhovor ${episode.label})`
      : `Espresso ${episode.label}: ${episode.title}`;
  const description = episode.description.startsWith("[")
    ? `${episode.series} ${episode.label} podcastu LEGS:ON – ${episode.title} Poslechni si díl, kapitoly a přepis.`
    : episode.description;
  return {
    title,
    description,
    alternates: { canonical: `/dily/${episode.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      images: episode.image ? [episode.image] : ["/images/picnic.jpg"],
    },
  };
}

export default async function EpisodePage({ params }: PageProps<"/dily/[slug]">) {
  const { slug } = await params;
  const [episode, episodes, articles, guests] = await Promise.all([
    getEpisode(slug),
    getEpisodes(),
    getArticles(),
    getGuests(),
  ]);
  if (!episode) notFound();

  const guest = episode.guestSlug ? await getGuest(episode.guestSlug) : undefined;
  const related = withSource(
    articles.filter((a) => a.episode === episodeRef(episode)),
    guests,
  );
  const more = episodes.filter((e) => e.slug !== episode.slug).slice(0, 3);
  const isInterview = episode.series === "Rozhovor";
  const [firstName, ...rest] = (episode.guest ?? "").split(" ");
  const lastName = rest.join(" ");

  return (
    <>
      <JsonLd data={podcastEpisodeLd(episode)} />
      <Breadcrumbs
        className="wrap pb-4"
        items={[
          { name: "Díly", href: "/dily" },
          { name: isInterview ? "Rozhovory" : "Espresso", href: "/dily" },
          { name: episode.label, href: `/dily/${episode.slug}` },
        ]}
      />

      {/* Hlavička s přehrávačem */}
      <section className="md:wrap">
        <div className="flex flex-wrap">
          <div className="flex min-w-0 flex-[1_1_360px] flex-col justify-between gap-6 bg-accent px-4 py-8 md:min-h-[560px] md:gap-10 md:p-10">
            <p className="eyebrow m-0 text-[13px] tracking-[2px] md:text-[15px]">
              {episode.series} {episode.label} · {longDate(episode.date)}
            </p>
            <div>
              {isInterview && episode.guest ? (
                <>
                  <p className="display m-0 text-[28px] leading-none md:text-[40px]">Rozhovor s</p>
                  <p className="display m-0 break-words text-[72px] leading-[0.9] md:text-[clamp(72px,7.5vw,112px)]">{firstName}</p>
                </>
              ) : (
                <p className="display m-0 text-[64px] leading-[0.9] md:text-[clamp(64px,6vw,96px)]">Espresso</p>
              )}
            </div>
          </div>

          <div className="on-dark flex min-w-0 flex-[999_1_560px] flex-col gap-7 bg-ink px-4 py-8 text-bg md:p-10">
            {episode.image && (
              <Image
                src={episode.image}
                alt={episode.guest ?? ""}
                width={760}
                height={600}
                priority
                sizes="380px"
                className={`block h-[240px] w-full max-w-[380px] self-center object-cover md:h-[300px] ${
                  isInterview ? "object-top" : ""
                }`}
              />
            )}
            <div>
              {isInterview && lastName ? (
                <>
                  <h1 className="display m-0 text-[72px] leading-[0.9] md:text-[clamp(80px,9vw,136px)]">
                    <span aria-hidden="true">{lastName}.</span>
                    <span className="sr-only">
                      {episode.guest}: {episode.title}
                    </span>
                  </h1>
                  <p className="m-0 mt-3 text-lg md:text-[22px]">{episode.title}</p>
                </>
              ) : (
                <h1 className="display m-0 text-[40px] leading-[0.98] md:text-[clamp(40px,4.5vw,64px)]">{episode.title}</h1>
              )}
            </div>
            <EpisodePlayer episode={playable(episode)} />
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium uppercase tracking-[1px]">
              <span className="py-2 text-on-dark-subtle">Poslechni i na</span>
              <a href={PLATFORMS.spotify} className="py-2 text-bg">Spotify</a>
              <a href={PLATFORMS.apple} className="py-2 text-bg">Apple</a>
              <a href={PLATFORMS.youtube} className="py-2 text-bg">YouTube</a>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap flex flex-wrap gap-16 py-14 md:py-[88px]">
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-14 md:gap-16">
          <div>
            <h2 className="display m-0 mb-4 text-[40px] leading-none md:text-5xl">O dílu</h2>
            <p className="m-0 max-w-[720px] md:text-[19px]">{episode.description}</p>
          </div>

          {episode.chapters.length > 0 && (
            <div>
              <h2 className="display m-0 mb-4 text-[40px] leading-none md:text-5xl">Kapitoly</h2>
              <Chapters episode={playable(episode)} chapters={episode.chapters} />
            </div>
          )}

          <div>
            <h2 className="display m-0 mb-4 text-[40px] leading-none md:text-5xl">Přepis</h2>
            <div className="bg-bg-light p-6 md:p-8">
              {episode.transcript.length > 0 ? (
                <Collapsible>
                  {episode.transcript.map((line, i) => (
                    <p key={i} className={`m-0 text-base ${i > 0 ? "mt-4" : ""} ${line.speaker ? "text-body" : "text-[#8A8478]"}`}>
                      {line.speaker && <strong className="font-semibold text-ink">{line.speaker}: </strong>}
                      {line.text}
                    </p>
                  ))}
                </Collapsible>
              ) : (
                <p className="m-0 text-base text-body">[Přepis se vygeneruje automaticky z audia a pomůže dílu ve vyhledávání.]</p>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <div>
              <h2 className="display m-0 mb-6 text-[40px] leading-none md:text-5xl">Články z tohoto dílu</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8">
                {related.map((a) => (
                  <ArticleCard key={a.slug} article={a} showSource={false} titleSize="text-[22px]" />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          {guest && (
            <Link href={`/hoste/${guest.slug}`} className="flex items-center gap-5 bg-bg-light p-6 no-underline">
              {guest.photo && (
                <Image src={guest.photo} alt="" width={176} height={208} className="block h-[104px] w-[88px] flex-none object-cover object-top" />
              )}
              <div>
                <p className="eyebrow m-0 text-xs text-muted">Host</p>
                <p className="display m-0 mt-1 text-[28px] leading-none">{guest.name}</p>
                <p className="m-0 mt-1.5 text-sm">Profil a všechny díly →</p>
              </div>
            </Link>
          )}
          <div className="on-dark flex flex-col gap-4 bg-ink p-8 text-bg">
            <p className="display m-0 text-[44px] leading-[0.95]">Baví tě LEGS:ON?</p>
            <p className="m-0 text-[15px] text-on-dark-muted">Podpoř nás na Herohero a pomoz nám točit další rozhovory.</p>
            <SubscribeLink placement="dil-aside" className="btn btn-accent py-4">
              Předplatit
            </SubscribeLink>
          </div>
          <div className="py-2">
            <p className="eyebrow m-0 mb-2">Sdílet díl</p>
            <ShareButtons path={`/dily/${episode.slug}`} title={episode.title} />
          </div>
        </aside>
      </section>

      <section className="bg-bg-light">
        <div className="wrap py-14 md:py-[88px]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 className="display m-0 text-[40px] leading-[0.95] md:text-[56px]">Další díly</h2>
            <Link href="/dily" className="eyebrow py-2 text-[15px]">
              Všechny díly →
            </Link>
          </div>
          <EpisodeList episodes={more} size="sm" />
        </div>
      </section>

      <CtaBand placement="dil-band" />
    </>
  );
}
