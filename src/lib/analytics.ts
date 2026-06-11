/**
 * Vendor-agnostic event tracking. Forwards to Google Analytics (gtag) and/or
 * Plausible if either is configured. Safe no-op on the server or when neither
 * is present.
 */
type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, options?: { props?: Props }) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: string, props: Props = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, props);
    window.plausible?.(event, { props });
  } catch {
    /* analytics must never break the app */
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
export const PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
