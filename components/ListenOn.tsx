import { BrandIcon, type Brand } from "@/components/BrandIcon";
import { PLATFORMS, PODCAST_RSS_URL } from "@/lib/site";

export function ListenOn() {
  const links: { brand: Brand; label: string; href: string }[] = [
    { brand: "spotify", label: "Spotify", href: PLATFORMS.spotify },
    { brand: "apple", label: "Apple Podcasts", href: PLATFORMS.apple },
    { brand: "youtube", label: "YouTube", href: PLATFORMS.youtube },
    { brand: "rss", label: "RSS", href: PODCAST_RSS_URL || "#" },
  ];
  return (
    <section className="wrap flex flex-wrap items-center justify-between gap-6 py-12 md:py-[72px]">
      <p className="display m-0 text-[32px] leading-none md:text-[40px]">Poslouchej, kde jsi zvyklý</p>
      <div className="flex flex-wrap gap-3">
        {links.map((l) => (
          <a key={l.label} href={l.href} className="btn btn-outline gap-2.5 px-5 py-3 text-[15px] font-medium normal-case tracking-normal">
            <BrandIcon brand={l.brand} size={18} />
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}
