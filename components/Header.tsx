"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SubscribeLink } from "@/components/TrackedLink";

const NAV = [
  { href: "/dily", label: "Díly" },
  { href: "/clanky", label: "Články" },
  { href: "/hoste", label: "Hosté" },
  { href: "/o-nas", label: "O nás" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Po přechodu na jinou stránku menu zavřít
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header>
      <div className="wrap flex items-center justify-between gap-3 py-4 md:flex-wrap md:gap-x-10 md:gap-y-4 md:py-7">
        <Link
          href="/"
          className="display text-[32px] leading-none tracking-[0.5px] no-underline normal-case md:text-[44px]"
        >
          LEGS:ON
        </Link>

        <nav
          aria-label="Hlavní menu"
          className="hidden flex-wrap items-center gap-x-8 gap-y-2 text-[15px] font-medium uppercase tracking-[1.5px] md:flex"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="py-2.5 no-underline aria-[current=page]:underline aria-[current=page]:underline-offset-8"
            >
              {item.label}
            </Link>
          ))}
          <SubscribeLink placement="header" className="bg-ink px-[18px] py-2.5 text-bg no-underline">
            Předplatit
          </SubscribeLink>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <SubscribeLink
            placement="header-mobile"
            className="bg-ink px-3.5 py-3 text-[13px] font-semibold uppercase tracking-[1px] text-bg no-underline"
          >
            Předplatit
          </SubscribeLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Zavřít menu" : "Menu"}
            aria-expanded={open}
            aria-controls="mobilni-menu"
            className="flex h-11 w-11 cursor-pointer items-center justify-center border-[1.5px] border-ink bg-transparent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#121212" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobilni-menu"
          aria-label="Hlavní menu"
          className="on-dark flex flex-col bg-ink px-4 pb-5 pt-2 md:hidden"
        >
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`display py-2.5 text-[32px] text-bg no-underline aria-[current=page]:text-accent-light ${
                i < NAV.length - 1 ? "border-b border-dark-line" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
