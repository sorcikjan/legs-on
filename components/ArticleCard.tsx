import Image from "next/image";
import Link from "next/link";
import { articleSource, topicSlug, type Article, type Guest } from "@/lib/content";

export type ArticleWithSource = Article & { source: string };

export function withSource(articles: Article[], guests: Guest[]): ArticleWithSource[] {
  const bySlug = new Map(guests.map((g) => [g.slug, g]));
  return articles.map((a) => ({
    ...a,
    source: articleSource(a, a.guests[0] ? bySlug.get(a.guests[0])?.withName : undefined),
  }));
}

/** Malá karta: téma · čtení, titulek, zdroj. */
export function ArticleCard({
  article,
  showSource = true,
  titleSize = "text-xl",
  showTime = true,
}: {
  article: ArticleWithSource;
  showSource?: boolean;
  titleSize?: string;
  showTime?: boolean;
}) {
  return (
    <Link
      href={`/clanky/${article.slug}`}
      className="group flex flex-col gap-2.5 border-t border-line pt-4 no-underline md:pt-5"
    >
      <p className="m-0 text-[13px] text-muted">
        {article.topic}
        {showTime && ` · ${article.minutes} min čtení`}
      </p>
      <h3 className={`m-0 font-medium leading-[1.3] group-hover:underline ${titleSize}`}>{article.title}</h3>
      {showSource && <p className="m-0 text-sm text-muted">{article.source}</p>}
    </Link>
  );
}

export function ArticleGrid({ articles, gap = "gap-x-10 gap-y-12" }: { articles: ArticleWithSource[]; gap?: string }) {
  return (
    <div className={`grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] ${gap}`}>
      {articles.map((a) => (
        <ArticleCard key={a.slug} article={a} />
      ))}
    </div>
  );
}

/** Dvě velké karty nahoře výpisu (hlavní + vedlejší). */
export function FeaturedArticles({
  main,
  side,
  heading = "h3",
}: {
  main: ArticleWithSource;
  side?: ArticleWithSource;
  heading?: "h2" | "h3";
}) {
  const H = heading;
  return (
    <div className="flex flex-wrap gap-12">
      <Link href={`/clanky/${main.slug}`} className="group flex min-w-0 flex-[999_1_600px] flex-col gap-3.5 no-underline">
        {main.image && (
          <Image
            src={main.image}
            alt={main.imageAlt}
            width={1200}
            height={880}
            sizes="(min-width: 1320px) 800px, 100vw"
            className="block h-[240px] w-full bg-ink object-cover object-[center_20%] md:h-[460px]"
          />
        )}
        <p className="m-0 mt-1.5 text-[13px] text-muted">
          {main.topic} · {main.source} · {main.minutes} min čtení
        </p>
        <H className="m-0 text-2xl font-medium leading-[1.2] tracking-[-0.5px] group-hover:underline md:text-[38px]">
          {main.title}
        </H>
        <p className="m-0 max-w-[640px] text-body">{main.perex}</p>
      </Link>
      {side && (
        <Link href={`/clanky/${side.slug}`} className="group flex min-w-0 flex-[1_1_340px] flex-col gap-3.5 no-underline">
          {side.image && (
            <Image
              src={side.image}
              alt={side.imageAlt}
              width={632}
              height={335}
              sizes="(min-width: 1320px) 420px, 100vw"
              className="block h-[220px] w-full bg-ink object-cover md:h-[280px]"
            />
          )}
          <p className="m-0 mt-1.5 text-[13px] text-muted">
            {side.topic} · {side.source} · {side.minutes} min čtení
          </p>
          <H className="m-0 text-2xl font-medium leading-[1.25] tracking-[-0.3px] group-hover:underline">{side.title}</H>
          <p className="m-0 text-base text-body">{side.perex}</p>
        </Link>
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
        <Link
          key={t}
          href={`/clanky/tema/${topicSlug(t)}`}
          className="pill"
          aria-current={current === t ? "page" : undefined}
        >
          {t}
        </Link>
      ))}
    </nav>
  );
}
