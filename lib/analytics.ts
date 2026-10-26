/**
 * Události funnelu (docs/ZADANI.md, bod 7). Analytika zatím není vybraná –
 * události se posílají do Plausible/Umami/GA4, pokud je na stránce načtený.
 */
export type AnalyticsEvent =
  | "play_episode"
  | "cta_predplatit_click"
  | "herohero_outbound"
  | "newsletter_signup"
  | "article_to_episode_click";

type Props = Record<string, string | number>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
    umami?: { track: (event: string, data?: Props) => void };
    gtag?: (command: "event", event: string, params?: Props) => void;
  }
}

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === "undefined") return;
  window.plausible?.(event, { props });
  window.umami?.track(event, props);
  window.gtag?.("event", event, props);
  if (process.env.NODE_ENV === "development") console.info("[analytics]", event, props);
}
