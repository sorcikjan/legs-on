import Link from "next/link";
import type { ReactNode } from "react";

/** Stavební kameny administrace: vzhled webu (barvy, písma), bez vlastního návrhu (docs/ROZHODNUTI.md). */

export const input =
  "w-full border border-line bg-white px-3 py-2 text-[15px] text-ink outline-none focus:border-ink disabled:bg-bg-muted";

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="m-0 font-display text-[40px] uppercase leading-none md:text-[52px]">{children}</h1>
      {actions}
    </div>
  );
}

const STATUS: Record<string, [string, string]> = {
  draft: ["Koncept", "bg-accent-light text-ink"],
  published: ["Zveřejněno", "bg-ink text-bg"],
  scheduled: ["Naplánováno", "bg-accent text-ink"],
  withdrawn: ["Staženo", "bg-bg-muted text-muted"],
  deleted: ["Smazáno", "bg-bg-muted text-muted line-through"],
};

export function StatusBadge({ status }: { status: string }) {
  const [label, cls] = STATUS[status] ?? [status, "bg-bg-muted"];
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 text-[12px] font-semibold uppercase ${cls}`}>{label}</span>;
}

/** Stav pro zobrazení: zveřejněné s datem v budoucnu je „naplánované“. */
export function displayStatus(row: { status: string; published_at: string | null; deleted_at?: string | null }) {
  if (row.deleted_at) return "deleted";
  if (row.status === "published" && row.published_at && row.published_at > new Date().toISOString()) return "scheduled";
  return row.status;
}

export function Tabs({ items, current }: { items: { href: string; label: string; key: string }[]; current: string }) {
  return (
    <nav className="mb-4 flex flex-wrap gap-2">
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`border px-3 py-1 text-[14px] no-underline ${t.key === current ? "border-ink bg-ink text-bg" : "border-line text-ink hover:border-ink"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export function Notice({ kind = "ok", children }: { kind?: "ok" | "error"; children: ReactNode }) {
  return (
    <p className={`m-0 mb-4 border px-4 py-3 text-[15px] ${kind === "ok" ? "border-ink bg-white" : "border-red-700 bg-red-50 text-red-800"}`}>
      {children}
    </p>
  );
}
