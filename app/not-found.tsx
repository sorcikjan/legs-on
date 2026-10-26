import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap py-20 md:py-32">
      <p className="eyebrow m-0 mb-4">Chyba 404</p>
      <h1 className="display m-0 text-[64px] leading-[0.9] md:text-[120px]">
        Tady jsme
        <br />
        sjeli z trasy.
      </h1>
      <p className="m-0 mt-6 max-w-[520px] text-lg">Tahle stránka neexistuje. Zkus nejnovější díly nebo články.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dily" className="btn btn-dark">
          Díly
        </Link>
        <Link href="/clanky" className="btn btn-outline">
          Články
        </Link>
      </div>
    </section>
  );
}
