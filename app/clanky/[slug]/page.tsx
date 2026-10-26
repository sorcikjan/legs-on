import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard, withSource } from "@/components/ArticleCard";
import { Breadcrumbs } from "@/components/bits";
import { CtaBand } from "@/components/CtaBand";
import { JsonLd } from "@/components/JsonLd";
import { PlayButton } from "@/components/player/PlayButton";
import { SubscribeLink, TrackedLink } from "@/components/TrackedLink";
import { getArticle, getArticles, getGuests, topicSlug, type Block } from "@/lib/content";
import { findEpisodeRef, playable, type Episode } from "@/lib/episodes";
import { longDate } from "@/lib/format";
import { articleLd } from "@/lib/jsonld";

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/clanky/[slug]">): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return {};
  const description = article.perex.startsWith("[") ? `${article.title}. Článek z podcastu LEGS:ON.` : article.perex;
  return {
    title: article.title,
    description,
    alternates: { canonical: `/clanky/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      publishedTime: article.date,
      images: article.image ? [article.image] : ["/images/picnic.jpg"],
    },
  };
}

function ArticlePlayer({ episode }: { episode: Episode }) {
  const name = episode.guest ? `rozhovor ${episode.label}` : `Espresso ${episode.label}`;
  return (
    <div className="on-dark my-10 flex flex-wrap items-center gap-5 bg-ink p-5 text-bg md:p-6">
      <PlayButton episode={playable(episode)} variant="accent" size={56} iconSize={20} label={name} />
      <div className="min-w-0 flex-[1_1_220px] leading-[1.4]">
        <p className="eyebrow m-0 text-xs text-on-dark-subtle">
          Poslechni si celý {episode.series === "Rozhovor" ? "rozhovor" : "díl"} · {episode.minutes} min
        </p>
        <p className="display m-0 mt-1 text-2xl leading-[1.1]">
          {episode.label} {episode.title}
        </p>
      </div>
    </div>
  );
}

function SubscribeBox() {
  return (
    <div className="my-12 flex flex-col gap-3.5 bg-bg p-6 md:p-8">
      <p className="display m-0 text-[30px] leading-none md:text-4xl">Tenhle článek vznikl díky předplatitelům</p>
      <p className="m-0 text-base leading-[1.6]">
        LEGS:ON točíme ze své vášně, ale bez podpory posluchačů by nevznikaly další rozhovory ani články.
      </p>
      <SubscribeLink placement="clanek-box" className="btn btn-dark self-start px-[22px] py-3.5">
        Předplatit LEGS:ON
      </SubscribeLink>
    </div>
  );
}

function Body({ blocks, episode }: { blocks: Block[]; episode?: Episode }) {
  return (
    <div className="prose-article">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return <h2 key={i}>{b.text}</h2>;
          case "quote":
            return (
              <blockquote key={i} className="mx-0 my-12">
                <p className="display m-0 text-[32px] leading-[1.1] md:text-[40px]">{b.text}</p>
                {b.author && <p className="m-0 mt-3 text-[15px] text-muted">{b.author}</p>}
              </blockquote>
            );
          case "player":
            return episode ? <ArticlePlayer key={i} episode={episode} /> : null;
          case "subscribe":
            return <SubscribeBox key={i} />;
          default:
            return (
              <p key={i} className={`m-0 ${b.text.startsWith("[") ? "placeholder" : ""}`}>
                {b.text}
              </p>
            );
        }
      })}
    </div>
  );
}

export default async function ArticlePage({ params }: PageProps<"/clanky/[slug]">) {
  const { slug } = await params;
  const [article, articles, guests] = await Promise.all([getArticle(slug), getArticles(), getGuests()]);
  if (!article) notFound();

  const episode = await findEpisodeRef(article.episode);
  const articleGuests = guests.filter((g) => article.guests.includes(g.slug));
  const guest = articleGuests[0];
  const [withMeta] = withSource([article], guests);
  const related = withSource(
    articles
      .filter((a) => a.slug !== article.slug)
      .sort((a, b) => Number(b.topic === article.topic) - Number(a.topic === article.topic))
      .slice(0, 3),
    guests,
  );

  return (
    <>
      <JsonLd data={articleLd(article)} />
      <div className="bg-bg-light leading-[1.7] md:text-lg">
        <article>
          <header className="mx-auto max-w-[880px] px-4 pb-8 pt-10 md:px-8 md:pb-10 md:pt-[72px]">
            <Breadcrumbs
              items={[
                { name: "Články", href: "/clanky" },
                { name: article.topic, href: `/clanky/tema/${topicSlug(article.topic)}` },
                { name: article.title, href: `/clanky/${article.slug}` },
              ]}
              hideCurrent
            />
            <h1 className="m-0 mt-4 text-[34px] font-medium leading-[1.12] tracking-[-1px] md:mt-5 md:text-[clamp(40px,5vw,56px)]">
              {article.title}
            </h1>
            <p className="m-0 mt-5 text-lg leading-[1.55] text-body md:text-[21px]">{article.perex}</p>
            <p className="m-0 mt-6 text-sm text-muted">
              {episode ? (
                <>
                  Z {episode.series === "Rozhovor" ? "rozhovoru" : "Espressa"}{" "}
                  <TrackedLink
                    href={`/dily/${episode.slug}`}
                    event="article_to_episode_click"
                    eventProps={{ article: article.slug, placement: "meta" }}
                    className="text-ink"
                  >
                    {episode.label}
                  </TrackedLink>
                </>
              ) : (
                withMeta.source
              )}{" "}
              · {article.minutes} min čtení · {longDate(article.date)} · Petr a Honza
            </p>
          </header>

          {article.image && (
            <div className="mx-auto max-w-[1120px] md:px-8">
              <Image
                src={article.image}
                alt={article.imageAlt}
                width={1200}
                height={700}
                priority
                sizes="(min-width: 1120px) 1056px, 100vw"
                className="block h-[260px] w-full bg-ink object-cover object-[center_20%] md:h-[520px]"
              />
            </div>
          )}

          <div className="mx-auto max-w-[720px] px-4 pt-10 md:px-8 md:pt-14">
            <Body blocks={article.blocks} episode={episode} />

            {episode && (
              <div className="mt-14 flex flex-wrap items-center gap-6 border-t border-line pt-8">
                {guest?.photo && (
                  <Image src={guest.photo} alt="" width={192} height={224} className="block h-28 w-24 flex-none object-cover object-top" />
                )}
                <div className="min-w-0 flex-[1_1_300px] leading-normal">
                  <p className="m-0 text-[13px] text-muted">Celý {episode.series === "Rozhovor" ? "rozhovor" : "díl"}</p>
                  <p className="m-0 mt-1 text-[22px] font-medium">
                    {guest ? `${guest.name} v LEGS:ON ${episode.label}` : `${episode.series} ${episode.label}: ${episode.title}`}
                  </p>
                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <TrackedLink
                      href={`/dily/${episode.slug}`}
                      event="article_to_episode_click"
                      eventProps={{ article: article.slug, placement: "footer" }}
                      className="btn btn-dark px-[18px] py-3 text-sm font-medium normal-case tracking-normal"
                    >
                      Pustit díl
                    </TrackedLink>
                    {guest && (
                      <Link href={`/hoste/${guest.slug}`} className="btn btn-outline border px-[17px] py-[11px] text-sm font-medium normal-case tracking-normal">
                        Profil hosta
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <Link key={t} href={`/clanky/tema/${topicSlug(t)}`} className="pill min-h-11 px-3.5 py-1.5">
                  {t}
                </Link>
              ))}
              {articleGuests.map((g) => (
                <Link key={g.slug} href={`/hoste/${g.slug}`} className="pill min-h-11 px-3.5 py-1.5">
                  {g.name}
                </Link>
              ))}
            </div>
          </div>
        </article>

        <section className="mx-auto max-w-[1120px] px-4 py-20 md:px-8 md:py-[120px]">
          <h2 className="m-0 mb-8 text-[28px] font-medium tracking-[-0.5px] md:text-[32px]">Mohlo by tě zajímat</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-10 leading-normal">
            {related.map((a) => (
              <ArticleCard key={a.slug} article={a} showSource={false} />
            ))}
          </div>
        </section>
      </div>
      <CtaBand placement="clanek-band" />
    </>
  );
}
