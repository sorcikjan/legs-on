import { PLATFORMS, PODCAST_RSS_URL } from "@/lib/site";

export function ListenOn() {
  const links = [
    { label: "Spotify", href: PLATFORMS.spotify },
    { label: "Apple Podcasts", href: PLATFORMS.apple },
    { label: "YouTube", href: PLATFORMS.youtube },
    { label: "RSS", href: PODCAST_RSS_URL || "#" },
  ];
  return (
    <section className="wrap flex flex-wrap items-center justify-between gap-6 py-12 md:py-[72px]">
      <p className="display m-0 text-[32px] leading-none md:text-[40px]">Poslouchej, kde jsi zvyklý</p>
      <div className="flex flex-wrap gap-3">
        {links.map((l) => (
          <a key={l.label} href={l.href} className="btn btn-outline px-5 py-3 text-[15px] font-medium normal-case tracking-normal">
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}
