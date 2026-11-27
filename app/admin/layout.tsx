import type { Metadata } from "next";
import Link from "next/link";
import { requireEditor } from "@/lib/editor";

export const metadata: Metadata = { title: "Administrace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Přehled" },
  { href: "/admin/clanky", label: "Články" },
  { href: "/admin/dily", label: "Díly" },
  { href: "/admin/hoste", label: "Hosté" },
  { href: "/admin/fotky", label: "Fotky" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const editor = await requireEditor();
  return (
    <div className="flex min-h-screen flex-col bg-bg-light">
      <header className="bg-ink text-bg">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
          <Link href="/admin" className="font-display text-[22px] uppercase text-bg no-underline">
            LEGS:ON <span className="text-accent">admin</span>
          </Link>
          <nav className="flex flex-wrap gap-4">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-[15px] text-on-dark-muted no-underline hover:text-bg">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-[14px] text-on-dark-subtle">
            <span>{editor}</span>
            <Link href="/" className="text-on-dark-muted no-underline hover:text-bg" target="_blank">
              Web ↗
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
