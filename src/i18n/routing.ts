import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["mn", "en"],
  defaultLocale: "mn",
  // Default locale (mn) stays unprefixed (/about); English is served under /en.
  localePrefix: "as-needed",
  // Mongolian is the primary language: never auto-redirect by browser language.
  // `/` always serves Mongolian; English is opt-in via the switcher or /en.
  // This also makes switching back to MN stick (detection won't bounce to /en).
  localeDetection: false,
  // No NEXT_LOCALE cookie: locale comes purely from the URL (detection is off,
  // and the switcher navigates by path). A Set-Cookie header would make every
  // HTML response uncacheable on the CDN, forcing each page view to round-trip
  // to the origin region instead of being served from the nearest edge.
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
