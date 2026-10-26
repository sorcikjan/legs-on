import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlesIndex } from "@/components/ArticlesIndex";
import { Breadcrumbs } from "@/components/bits";
import { topicFromSlug, topicSlug, TOPICS } from "@/lib/content";

export function generateStaticParams() {
  return TOPICS.map((t) => ({ tema: topicSlug(t) }));
}

export async function generateMetadata({ params }: PageProps<"/clanky/tema/[tema]">): Promise<Metadata> {
  const topic = topicFromSlug((await params).tema);
  if (!topic) return {};
  return {
    title: `${topic} – články z podcastu`,
    description: `Články z podcastu LEGS:ON na téma ${topic.toLowerCase()}. Z každého rozhovoru a Espressa to podstatné, s odkazem na celý díl.`,
    alternates: { canonical: `/clanky/tema/${topicSlug(topic)}` },
  };
}

export default async function TopicPage({ params }: PageProps<"/clanky/tema/[tema]">) {
  const topic = topicFromSlug((await params).tema);
  if (!topic) notFound();
  return (
    <>
      <div className="bg-bg-light">
        <Breadcrumbs
          className="wrap pt-6"
          items={[
            { name: "Články", href: "/clanky" },
            { name: topic, href: `/clanky/tema/${topicSlug(topic)}` },
          ]}
        />
      </div>
      <ArticlesIndex topic={topic} />
    </>
  );
}
