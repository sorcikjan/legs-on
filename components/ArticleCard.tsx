import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";
import { articleSource, topicSlug, type Article, type Guest, type Topic } from "@/lib/content";
import { episodeRef, type Episode } from "@/lib/episodes";

/**
 * Články jako magazín z dílů: každý má obrázek (vlastní fotka → fotka hosta → fotka dílu → obálka dílu),
 * titulek písmem Anton jako díly a téma barevným štítkem.
 */

export type ArticleCover = { src: string; alt: string; artwork: boolean };
export type ArticleWithSource = Article & { source: string; cover?: ArticleCover };

export function withSource(articles: Article[], guests: Guest[], episodes: Episode[]): ArticleWithSource[] {
  const bySlug = new Map(guests.map((g) => [g.slug, g]));
  const byRef = new Map<string, Episode>();
  for (const e of episodes) if (!byRef.has(episodeRef(e))) byRef.set(episodeRef(e), e);
  return articles.map((a) => {
    const guest = a.guests.map((s) => bySlug.get(s)).find(Boolean);
    const withPhoto = a.guests.map((s) => bySlug.get(s)).find((g) => g?.photo);
    const episode = byRef.get(a.episode);
    const cover: ArticleCover | undefined = a.image
      ? { src: a.image, alt: a.imageAlt || a.title, artwork: false }
      : withPhoto?.photo
        ? { src: withPhoto.photo, alt: withPhoto.name, artwork: false }
        : episode?.image
          ? { src: episode.image, alt: episode.title, artwork: false }
          : episode?.cover
            ? { src: episode.cover, alt: `Obálka dílu ${episode.title}`, artwork: true }
            : undefined;
    return { ...a, source: articleSource(a, guest?.withName), cover };
  });
}

/** Barvy témat jen z palety webu (docs/ZADANI.md, tokeny v globals.css). */
const TOPIC_STYLE: Record<Topic, string> = {
  Silnice: "bg-accent text-ink",
  MTB: "bg-ink text-bg",
  Gravel: "bg-accent-light text-ink",
  Cyklokros: "bg-muted text-bg",
  "Zákulisí týmů": "border border-ink text-ink",
  Příběhy: "border border-accent text-ink",
};

export function TopicTag({ topic, className = "" }: { topic: Topic; className?: string }) {
  return (
    <span className={`inline-block px-2 py-[3px] text-[11px] font-semibold uppercase leading-none tracking-[1px] ${TOPIC_STYLE[topic]} ${className}`}>
      {topic}
    </span>
  );
}

/** Obrázek článku. Obálka dílu (čtverec s textem) se nepřiřezává, ale vloží celá na tmavé pozadí. */
function Cover({ article, sizes, className }: { article: ArticleWithSource; sizes: string; className: string }) {
  const c = article.cover;
  return (
    <div className={`relative overflow-hidden bg-ink ${className}`}>
      {c ? (
        <SiteImage
          src={c.src}
          alt={c.alt}
          fill
          sizes={sizes}
          className={`transition-transform duration-500 ease-out group-hover:scale-[1.03] ${c.artwork ? "object-contain p-[6%]" : "object-cover object-[center_25%]"}`}
        />
      ) : (
        <span className="display absolute inset-0 flex items-center justify-center text-[clamp(28px,5vw,56px)] text-dark-line">LEGS:ON</span>
      )}
    </div>
  );
}

/** Karta do mřížky: obrázek, téma, titulek, zdroj. */
export function ArticleCard({
  article,
  showSource = true,
  titleSize = "text-[22px] md:text-[24px]",
  showTime = true,
}: {
  article: ArticleWithSource;
  showSource?: boolean;
  titleSize?: string;
  showTime?: boolean;
}) {
  return (
    <Link href={`/clanky/${article.slug}`} className="group flex flex-col gap-3 no-underline">
      <Cover article={article} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="aspect-[3/2] w-full" />
      <p className="m-0 mt-1 flex flex-wrap items-center gap-2.5 text-[13px] text-muted">
        <TopicTag topic={article.topic} />
        {showTime && <span>{article.minutes} min čtení</span>}
      </p>
      <h3 className={`display m-0 leading-[1.14] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4 ${titleSize}`}>{article.title}</h3>
      {showSource && <p className="m-0 text-sm text-muted">{article.source}</p>}
    </Link>
  );
}

export function ArticleGrid({ articles, gap = "gap-x-8 gap-y-12" }: { articles: ArticleWithSource[]; gap?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${gap}`}>
      {articles.map((a) => (
        <ArticleCard key={a.slug} article={a} />
      ))}
    </div>
  );
}

/**
 * Hlavní článek velký vlevo, vedle až dva menší s obrázkem.
 * Na homepage tři výrazné články místo dlouhé textové mřížky.
 */
export function FeaturedArticles({
  main,
  side = [],
  heading = "h3",
}: {
  main: ArticleWithSource;
  side?: ArticleWithSource[];
  heading?: "h2" | "h3";
}) {
  const H = heading;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:gap-12">
      <Link href={`/clanky/${main.slug}`} className="group flex min-w-0 flex-col gap-4 no-underline">
        <Cover article={main} sizes="(min-width: 1320px) 780px, (min-width: 1024px) 60vw, 100vw" className="aspect-[3/2] w-full lg:aspect-[16/10]" />
        <p className="m-0 mt-1 flex flex-wrap items-center gap-2.5 text-[13px] text-muted">
          <TopicTag topic={main.topic} />
          <span>{main.source} · {main.minutes} min čtení</span>
        </p>
        <H className="display m-0 text-[34px] leading-[1.12] group-hover:underline group-hover:decoration-[3px] group-hover:underline-offset-[6px] md:text-[52px]">
          {main.title}
        </H>
        <p className="m-0 max-w-[640px] text-body md:text-[17px]">{main.perex}</p>
      </Link>
      {side.length > 0 && (
        <div className="flex min-w-0 flex-col gap-10">
          {side.map((a) => (
            <ArticleCard key={a.slug} article={a} titleSize="text-[24px] md:text-[28px]" />
          ))}
        </div>
      )}
    </div>
  );
}

/** Pill filtr témat – odkazy na samostatné stránky /clanky/tema/[tema]. */
export function TopicPills({ topics, current }: { topics: readonly string[]; current?: string }) {
  return (
    <nav aria-label="Témata článků" className="flex flex-wrap gap-2">
      <Link href="/clanky" className="pill" aria-current={!current ? "page" : undefined}>
        Vše
      </Link>
      {topics.map((t) => (
        <Link key={t} href={`/clanky/tema/${topicSlug(t)}`} className="pill" aria-current={current === t ? "page" : undefined}>
          {t}
        </Link>
      ))}
    </nav>
  );
}
