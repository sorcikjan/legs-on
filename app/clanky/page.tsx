import type { Metadata } from "next";
import { ArticlesIndex } from "@/components/ArticlesIndex";

/** Záchranná síť, kdyby revalidace po nasazení nebo po úpravě selhala (docs/tech/SPIKE-CLOUDFLARE.md). */
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Články o cyklistice z podcastu",
  description:
    "Silnice, MTB, gravel, zákulisí týmů a příběhy. Články z rozhovorů a Espressa podcastu LEGS:ON – přečti si to podstatné a pusť si celý díl.",
  alternates: { canonical: "/clanky" },
};

export default function ArticlesPage() {
  return <ArticlesIndex />;
}
