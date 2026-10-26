import { SubscribeLink } from "@/components/TrackedLink";

/** Tmavý pás „Šlapej s námi.“ na konci každé stránky → /predplatne. */
export function CtaBand({ placement }: { placement: string }) {
  return (
    <section className="on-dark bg-ink text-bg">
      <div className="wrap flex flex-wrap items-end justify-between gap-10 py-14 md:py-24">
        <div className="min-w-0 flex-[1_1_560px]">
          <h2 className="display m-0 text-[clamp(56px,7vw,96px)] leading-[0.9]">Šlapej s námi.</h2>
          <p className="m-0 mt-4 max-w-[520px] text-lg text-on-dark-muted">
            Předplatitelé na Herohero drží LEGS:ON v sedle.
          </p>
        </div>
        <SubscribeLink placement={placement} className="btn btn-accent w-full px-8 py-5 text-base md:w-auto">
          Předplatit
        </SubscribeLink>
      </div>
    </section>
  );
}
