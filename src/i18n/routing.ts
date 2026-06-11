import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["mn", "en"],
  defaultLocale: "mn",
  // Default locale (mn) stays unprefixed (/about); English is served under /en.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
