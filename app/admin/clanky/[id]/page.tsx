import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/ArticleForm";
import { displayStatus, Notice, PageTitle, StatusBadge } from "@/components/admin/ui";
import { articleFormOptions, articleRevisions, getAdminArticle } from "@/lib/admin/articles";
import { isoToPragueLocal, pragueDateTime } from "@/lib/time";

const OK: Record<string, string> = {
  save: "Uloženo.",
  publish: "Schváleno a zveřejněno.",
  withdraw: "Článek je stažený z webu.",
  delete: "Článek je smazaný. Jde obnovit.",
  restore: "Článek je obnovený.",
};

export default async function AdminArticle({ params, searchParams }: PageProps<"/admin/clanky/[id]">) {
  const { id } = await params;
  const ok = String((await searchParams).ok ?? "");
  const isNew = id === "novy";
  const article = isNew ? null : await getAdminArticle(Number(id));
  if (!isNew && !article) notFound();
  const [options, revisions] = await Promise.all([articleFormOptions(), article ? articleRevisions(article.id) : []]);
  const status = article ? displayStatus(article) : "draft";

  return (
    <>
      <p className="m-0 mb-2 text-[14px]">
        <Link href="/admin/clanky">← Články</Link>
      </p>
      <PageTitle
        actions={
          article && article.status === "published" && !article.deleted_at ? (
            <Link href={`/clanky/${article.slug}`} target="_blank" className="btn btn-outline">Otevřít na webu ↗</Link>
          ) : undefined
        }
      >
        {isNew ? "Nový článek" : "Článek"}
      </PageTitle>
      {article && (
        <p className="m-0 mb-4 flex flex-wrap items-center gap-3 text-[14px] text-muted">
          <StatusBadge status={status} />
          {article.approved_by && <span>schválil {article.approved_by} {pragueDateTime(article.approved_at)}</span>}
          {article.source === "llm" && <span>koncept připravil web z dílu</span>}
        </p>
      )}
      {OK[ok] && <Notice>{OK[ok]}</Notice>}
      <ArticleForm key={article?.updated_at ?? "new"} article={article} options={options} publishedAtLocal={isoToPragueLocal(article?.published_at)} />
      {revisions.length > 0 && (
        <details className="mt-10 text-[14px] text-muted">
          <summary className="cursor-pointer">Historie verzí ({revisions.length})</summary>
          <ul className="mt-2">
            {revisions.map((r) => (
              <li key={r.id}>{pragueDateTime(r.saved_at)} · {r.saved_by} · {r.title}</li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
