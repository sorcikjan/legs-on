import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/bits";
import { CtaBand } from "@/components/CtaBand";
import { GuestSearch } from "@/components/GuestSearch";
import { PersonPlaceholder } from "@/components/icons";
import { getGuests } from "@/lib/content";
import { episodeTag, getEpisodes } from "@/lib/episodes";

export const metadata: Metadata = {
  title: "Hosté podcastu",
  description:
    "Olympionici, šéfové týmů, vítězové etapáků i lidi, které cyklistika chytla. Všichni hosté podcastu LEGS:ON s jejich díly a články.",
  alternates: { canonical: "/hoste" },
};

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default async function GuestsPage() {
  const [guests, episodes] = await Promise.all([getGuests(), getEpisodes()]);

  const cards = Object.fromEntries(
    guests.map((g) => {
      const eps = episodes.filter((e) => e.guestSlug === g.slug).map(episodeTag);
      const label = [...eps, ...g.episodeLabels].join(" · ") || "[díl]";
      return [
        g.slug,
        <Link key={g.slug} href={`/hoste/${g.slug}`} className="group flex flex-col gap-2 no-underline md:gap-3">
          <div className="aspect-[4/5] w-full bg-ink">
            {g.photo ? (
              <Image
                src={g.photo}
                alt={g.name}
                width={406}
                height={508}
                sizes="(min-width: 768px) 300px, 50vw"
                className="block h-full w-full object-cover object-top"
              />
            ) : (
              <PersonPlaceholder iconSize={64} />
            )}
          </div>
          <p className="display m-0 text-[22px] leading-[1.05] group-hover:underline md:text-[28px]">{g.name}</p>
          <p className="m-0 text-sm text-muted">{g.role}</p>
          <p className="eyebrow m-0 text-xs md:text-[13px]">{label}</p>
        </Link>,
      ];
    }),
  );
  const items = guests.map((g) => ({ slug: g.slug, search: fold(`${g.name} ${g.role} ${g.discipline} ${g.team}`) }));
  const az = [...guests].sort((a, b) => a.name.split(" ").at(-1)!.localeCompare(b.name.split(" ").at(-1)!, "cs"));

  return (
    <>
      <GuestSearch items={items} cards={cards} />
      <section className="wrap py-12 md:py-[72px]">
        <SectionLabel>Všichni hosté A–Z</SectionLabel>
        <p className="m-0 max-w-[1000px] text-base leading-[2]">
          {az.map((g, i) => (
            <span key={g.slug}>
              {i > 0 && " · "}
              <Link href={`/hoste/${g.slug}`}>{g.name}</Link>
            </span>
          ))}
          {" · "}[další jména z archivu]
        </p>
      </section>
      <CtaBand placement="hoste-band" />
    </>
  );
}
