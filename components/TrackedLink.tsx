"use client";

import Link from "next/link";
import { track, type AnalyticsEvent } from "@/lib/analytics";

type Props = React.ComponentProps<typeof Link> & {
  event: AnalyticsEvent;
  eventProps?: Record<string, string | number>;
};

/** Odkaz, který při kliknutí zaznamená událost funnelu. */
export function TrackedLink({ event, eventProps, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}

/** Hlavní CTA „Předplatit“ – vždy vede na /predplatne. */
export function SubscribeLink({
  placement,
  ...props
}: Omit<Props, "href" | "event" | "eventProps"> & { placement: string }) {
  return (
    <TrackedLink
      href="/predplatne"
      event="cta_predplatit_click"
      eventProps={{ placement }}
      {...props}
    />
  );
}

/** Jediný odchod na Herohero – jen ze stránky /predplatne. */
export function HeroheroLink({
  href,
  placement,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; placement: string }) {
  return (
    <a
      href={href}
      rel="noopener"
      onClick={() => track("herohero_outbound", { placement })}
      {...props}
    />
  );
}
