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
});

export type Locale = (typeof routing.locales)[number];
