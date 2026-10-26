"use client";

import { useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { SITE_URL } from "@/lib/site";

/** Přepis je celý v HTML (kvůli vyhledávání), jen vizuálně sbalený. */
export function Collapsible({ children, label = "Zobrazit celý přepis" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div id="prepis-text" className={open ? "" : "max-h-[220px] overflow-hidden [mask-image:linear-gradient(180deg,#000_60%,transparent)]"}>
        {children}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="prepis-text"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-outline mt-6 px-5 py-3 text-sm"
      >
        {open ? "Sbalit přepis" : label}
      </button>
    </div>
  );
}

export function ShareButtons({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE_URL}${path}`;
  const btn =
    "inline-flex min-h-11 cursor-pointer items-center border border-ink bg-transparent px-3.5 py-2.5 font-sans text-sm text-ink no-underline";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Zkopírováno ✓" : "Kopírovat odkaz"}
      </button>
      <a className={btn} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
    </div>
  );
}

/** Newsletter – zatím bez napojení na službu, jen zaznamená událost. */
export function NewsletterForm({ placement }: { placement: string }) {
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <p role="status" className="m-0 min-w-0 flex-[1_1_380px] text-lg font-medium">
        Díky! Brzy se ozveme do mailu.
      </p>
    );
  return (
    <form
      className="flex min-w-0 flex-[1_1_380px] flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        track("newsletter_signup", { placement });
        setSent(true);
      }}
    >
      <div className="flex flex-[1_1_220px] flex-col gap-1.5">
        <label htmlFor={`nl-email-${placement}`} className="text-[13px] font-medium">
          E-mail
        </label>
        <input id={`nl-email-${placement}`} type="email" required autoComplete="email" placeholder="ty@email.cz" className="field border px-3.5 py-[13px]" />
      </div>
      <button type="submit" className="btn btn-dark min-h-[52px] px-[22px] font-medium normal-case tracking-normal">
        Odebírat
      </button>
    </form>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="border-t-[1.5px] border-ink">
      {items.map((item, i) => (
        <div key={item.q} className="border-b-[1.5px] border-ink">
          <h3 className="m-0">
            <button
              type="button"
              aria-expanded={open === i}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-[22px] text-left font-sans text-lg font-medium text-ink md:text-xl"
            >
              {item.q}
              <span aria-hidden="true" className="text-[28px] leading-none">
                {open === i ? "−" : "+"}
              </span>
            </button>
          </h3>
          <p id={`faq-${i}`} hidden={open !== i} className="m-0 mb-6 max-w-[720px] text-body">
            {item.a}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Poptávka partnerů – bez backendu zatím otevře e-mail s vyplněnými údaji. */
export function PartnerForm({ email }: { email: string }) {
  const [note, setNote] = useState("");
  const field = "w-full rounded-none border border-[#5A5750] bg-[#1E1E1C] p-3.5 font-sans text-base text-bg";
  const label = "eyebrow";
  return (
    <form
      className="grid min-w-0 flex-[999_1_560px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (!email.includes("@")) {
          setNote("Formulář zatím není napojený – e-mail pro partnery doplní tvůrci.");
          return;
        }
        const body = `Jméno: ${data.get("jmeno")}\nFirma: ${data.get("firma")}\nE-mail: ${data.get("email")}\nZájem o: ${data.get("format")}\n\n${data.get("zprava")}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent("Spolupráce s LEGS:ON")}&body=${encodeURIComponent(body)}`;
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="p-jmeno" className={label}>Jméno</label>
        <input id="p-jmeno" name="jmeno" required autoComplete="name" className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="p-firma" className={label}>Firma</label>
        <input id="p-firma" name="firma" autoComplete="organization" className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="p-email" className={label}>E-mail</label>
        <input id="p-email" name="email" type="email" required autoComplete="email" className={field} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="p-format" className={label}>Zájem o</label>
        <select id="p-format" name="format" className={field}>
          <option>Partner Espressa</option>
          <option>Partner rozhovoru</option>
          <option>Článek na webu</option>
          <option>Něco jiného</option>
        </select>
      </div>
      <div className="col-span-full flex flex-col gap-2">
        <label htmlFor="p-zprava" className={label}>Zpráva</label>
        <textarea id="p-zprava" name="zprava" rows={4} className={`${field} resize-y`} />
      </div>
      <button type="submit" className="btn btn-accent col-span-full justify-self-start px-8 py-[18px] text-base">
        Odeslat
      </button>
      {note && (
        <p role="status" className="col-span-full m-0 text-on-dark-muted">
          {note}
        </p>
      )}
    </form>
  );
}
