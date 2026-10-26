import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import type { Guest } from "@/lib/content";
import { breadcrumbLd } from "@/lib/jsonld";

/**
 * Drobečková navigace + BreadcrumbList JSON-LD. Poslední položka je aktuální stránka;
 * hideCurrent ji zobrazí jen v JSON-LD (u článku je titulek hned pod ní).
 */
export function Breadcrumbs({
  items,
  className = "",
  hideCurrent = false,
}: {
  items: { name: string; href: string }[];
  className?: string;
  hideCurrent?: boolean;
}) {
  const trail = [{ name: "LEGS:ON", href: "/" }, ...items];
  const visible = hideCurrent ? items.slice(0, -1) : items;
  return (
    <>
      <JsonLd data={breadcrumbLd(trail)} />
      <nav aria-label="Drobečková navigace" className={`text-sm text-muted ${className}`}>
        {visible.map((item, i) => (
          <span key={item.href + i}>
            {i > 0 && " / "}
            {i === items.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.href} className="inline-block py-2">
                {item.name}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}

/** Jména hostů v Antonu oddělená karamelovým lomítkem. */
export function GuestNames({
  guests,
  moreHref,
  moreLabel,
}: {
  guests: Pick<Guest, "slug" | "name">[];
  moreHref: string;
  moreLabel: string;
}) {
  return (
    <div className="display flex flex-wrap gap-x-4 gap-y-1 text-xl leading-[1.4] md:text-[26px] md:leading-[1.3]">
      {guests.map((g) => (
        <Link key={g.slug} href={`/hoste/${g.slug}`} className="no-underline hover:underline">
          {g.name}
          <span aria-hidden="true" className="text-accent">
            {" "}
            /
          </span>
        </Link>
      ))}
      <Link href={moreHref} className="underline-offset-4">
        {moreLabel}
      </Link>
    </div>
  );
}

export function SectionLabel({ children, as: As = "h2", className = "" }: { children: React.ReactNode; as?: "h2" | "p"; className?: string }) {
  return (
    <As className={`m-0 mb-4 text-xs font-semibold uppercase tracking-[2px] text-muted md:text-sm ${className}`}>
      {children}
    </As>
  );
}
