import Link from "next/link";
import { SOCIALS } from "@/lib/site";

export function Footer() {
  return (
    <footer className="on-dark border-t border-[#2A2926] bg-ink text-on-dark-subtle">
      <div className="wrap flex flex-col gap-3 py-6 text-[13px] uppercase tracking-[1px] md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-8 md:gap-y-4 md:py-8 md:text-sm">
        <Link href="/" className="display text-[26px] normal-case tracking-[0.5px] text-bg no-underline md:text-[28px]">
          LEGS:ON
        </Link>
        <span className="flex flex-wrap gap-x-6 gap-y-2">
          <a href={SOCIALS.instagram} className="py-2">Instagram</a>
          <a href={SOCIALS.facebook} className="py-2">Facebook</a>
          <a href={SOCIALS.youtube} className="py-2">YouTube</a>
          <Link href="/pro-partnery" className="py-2">Pro partnery</Link>
        </span>
      </div>
    </footer>
  );
}
