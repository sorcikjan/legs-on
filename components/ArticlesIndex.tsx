import { ArticleGrid, FeaturedArticles, TopicPills, withSource } from "@/components/ArticleCard";
import { CtaBand } from "@/components/CtaBand";
import { NewsletterForm } from "@/components/Interactive";
import { getArticles, getGuests, TOPICS, type Topic } from "@/lib/content";

/** Výpis článků – /clanky i /clanky/tema/[tema]. */
export async function ArticlesIndex({ topic }: { topic?: Topic }) {
  const [articles, guests] = await Promise.all([getArticles(), getGuests()]);
  const all = withSource(articles, guests).filter((a) => !topic || a.topic === topic);
  // Velké karty jen pro články s fotkou
  const candidates = topic ? all : all.filter((a) => a.featured > 0).sort((a, b) => a.featured - b.featured);
  const top = candidates.filter((a) => a.image).slice(0, 2);
  const grid = all.filter((a) => !top.includes(a));

  return (
    <div className="bg-bg-light">
      <div className="wrap pb-20 pt-10 md:pb-[120px] md:pt-20">
        <h1 className="m-0 text-[44px] font-medium leading-[1.05] tracking-[-1px] md:text-[64px] md:tracking-[-1.5px]">
          {topic ? `Články: ${topic}` : "Články"}
        </h1>
        <p className="m-0 mt-3.5 max-w-[620px] text-muted md:text-[19px]">
          Z každého dílu vzniká článek. Přečti si to podstatné, a když tě to chytne, pusť si celý díl.
        </p>
        <div className="mb-10 mt-8 md:mb-14 md:mt-10">
          <TopicPills topics={TOPICS} current={topic} />
        </div>

        {top[0] && <FeaturedArticles main={top[0]} side={top[1]} heading="h2" />}

        {grid.length > 0 && (
          <div className={top[0] ? "mt-14 md:mt-20" : ""}>
            <ArticleGrid articles={grid} gap="gap-x-10 gap-y-10 md:gap-y-14" />
          </div>
        )}
        {all.length === 0 && <p className="m-0 text-muted">K tomuhle tématu zatím článek nemáme.</p>}

        <div
          id="newsletter"
          className="mt-16 flex scroll-mt-6 flex-wrap items-center justify-between gap-x-12 gap-y-6 bg-bg p-6 md:mt-24 md:p-12"
        >
          <div className="min-w-0 flex-[1_1_420px]">
            <p className="m-0 text-[22px] font-medium leading-[1.25] md:text-[28px]">Nové články a díly jednou týdně do mailu</p>
            <p className="m-0 mt-1.5 text-[15px] text-muted">Žádný spam. Jen cyklistika.</p>
          </div>
          <NewsletterForm placement={topic ? `tema-${topic}` : "clanky"} />
        </div>
      </div>
      <CtaBand placement="clanky-band" />
    </div>
  );
}
