import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard, withSource } from "@/components/ArticleCard";
import { Breadcrumbs, GuestNames, SectionLabel } from "@/components/bits";
import { CtaBand } from "@/components/CtaBand";
import { PersonPlaceholder, PlayIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { SubscribeLink } from "@/components/TrackedLink";
import { getArticles, getGuest, getGuests } from "@/lib/content";
import { getEpisodesByGuest } from "@/lib/episodes";
import { shortDate } from "@/lib/format";
import { personLd } from "@/lib/jsonld";

export async function generateStaticParams() {
  return (await getGuests()).map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/hoste/[slug]">): Promise<Metadata> {
  const guest = await getGuest((await params).slug);
  if (!guest) return {};
  const role = guest.role.startsWith("[") ? "" : ` – ${guest.role}`;
  return {
    title: `${guest.name}: rozhovor a články`,
    description: `${guest.name}${role}. Všechny díly a články s hostem podcastu LEGS:ON.`,
    alternates: { canonical: `/hoste/${guest.slug}` },
    openGraph: { type: "profile", images: guest.photo ? [guest.photo] : ["/images/picnic.jpg"] },
  };
}

export default async function GuestPage({ params }: PageProps<"/hoste/[slug]">) {
  const { slug } = await params;
  const [guest, guests, articles, episodes] = await Promise.all([
    getGuest(slug),
    getGuests(),
    getArticles(),
    getEpisodesByGuest(slug),
  ]);
  if (!guest) notFound();

  const related = withSource(
    articles.filter((a) => a.guests.includes(guest.slug)),
    guests,
  );
  const others = guests.filter((g) => g.slug !== guest.slug).slice(0, 4);
  const [first, ...rest] = guest.name.split(" ");
  const count = episodes.length + guest.episodeLabels.length;

  return (
    <>
      <JsonLd data={personLd(guest)} />
      <Breadcrumbs
        className="wrap pb-4"
        items={[
          { name: "Hosté", href: "/hoste" },
          { name: guest.name, href: `/hoste/${guest.slug}` },
        ]}
      />

      <section className="md:wrap">
        <div className="flex flex-wrap">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col justify-between gap-10 bg-accent px-4 py-8 md:min-h-[520px] md:px-10 md:py-12">
            <p className="eyebrow m-0 tracking-[2px] md:text-[15px]">Host LEGS:ON</p>
            <div>
              <h1 className="display m-0 text-[72px] leading-[0.88] md:text-[clamp(80px,10vw,150px)]">
                {first}
                <br />
                {rest.join(" ")}.
              </h1>
              <p className="m-0 mt-6 max-w-[520px] md:text-xl">{guest.role}</p>
            </div>
          </div>
          <div className="relative min-h-[360px] min-w-0 flex-[1_1_380px] bg-ink md:min-h-[520px]">
            {guest.photo ? (
              <Image
                src={guest.photo}
                alt={guest.name}
                fill
                priority
                sizes="(min-width: 768px) 440px, 100vw"
                className="object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0">
                <PersonPlaceholder label="Foto hosta" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="wrap flex flex-wrap gap-16 py-14 md:py-[88px]">
        <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-14 md:gap-16">
          <div>
            <h2 className="display m-0 mb-6 text-[40px] leading-none md:text-5xl">Díly s {guest.shortWith}</h2>
            <div className="flex flex-col gap-3">
              {episodes.map((e) => (
                <Link
                  key={e.slug}
                  href={`/dily/${e.slug}`}
                  className="on-dark flex flex-wrap items-center gap-6 bg-ink p-6 text-bg no-underline"
                >
                  <span className="flex h-[60px] w-[60px] flex-none items-center justify-center rounded-full bg-accent text-ink" aria-hidden="true">
                    <PlayIcon size={22} />
                  </span>
                  <div className="min-w-0 flex-[1_1_300px]">
                    <p className="eyebrow m-0 text-on-dark-subtle">
                      {e.series} {e.label} · {shortDate(e.date)} · {e.minutes} min
                    </p>
                    <p className="display m-0 mt-1.5 text-[26px] leading-[1.05] md:text-[32px]">{e.title}</p>
                  </div>
                </Link>
              ))}
              {guest.episodeLabels.map((label) => (
                <div key={label} className="border-[1.5px] border-dashed border-pill-line p-6 text-muted">
                  <p className="eyebrow m-0">{label}</p>
                  <p className="m-0 mt-1">[Díl se doplní po napojení RSS feedu.]</p>
                </div>
              ))}
            </div>
          </div>

          {related.length > 0 && (
            <div>
              <h2 className="display m-0 mb-6 text-[40px] leading-none md:text-5xl">Články</h2>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8">
                {related.map((a) => (
                  <ArticleCard key={a.slug} article={a} showSource={false} titleSize="text-[22px]" />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <div className="bg-bg-light p-7">
            <h2 className="m-0 mb-3 text-sm font-semibold uppercase tracking-[2px]">O hostovi</h2>
            <p className="m-0 text-base">{guest.bio}</p>
            <dl className="m-0 mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]">
              {guest.discipline && (
                <>
                  <dt className="text-muted">Disciplína</dt>
                  <dd className="m-0">{guest.discipline}</dd>
                </>
              )}
              {guest.team && (
                <>
                  <dt className="text-muted">Tým</dt>
                  <dd className="m-0">{guest.team}</dd>
                </>
              )}
              <dt className="text-muted">V podcastu</dt>
              <dd className="m-0">{count === 1 ? "1 díl" : count < 5 ? `${count} díly` : `${count} dílů`}</dd>
            </dl>
          </div>
          <div className="on-dark flex flex-col gap-3.5 bg-ink p-7 text-bg">
            <p className="display m-0 text-4xl leading-[0.95]">Další takové rozhovory?</p>
            <p className="m-0 text-[15px] text-on-dark-muted">Podpoř LEGS:ON a pomoz nám zvát další hosty.</p>
            <SubscribeLink placement="host-aside" className="btn btn-accent">
              Předplatit
            </SubscribeLink>
          </div>
        </aside>
      </section>

      <section className="bg-bg-light">
        <div className="wrap py-12 md:py-[72px]">
          <SectionLabel>Další hosté</SectionLabel>
          <GuestNames guests={others} moreHref="/hoste" moreLabel="všichni hosté →" />
        </div>
      </section>

      <CtaBand placement="host-band" />
    </>
  );
}
