import { defineRouting } from "next-intl/routing";

// "as-needed" is what makes English the unprefixed default — /book stays
// /book, and only Arabic gets a visible /ar prefix (/ar/book). Only the
// patient-facing (site) tree is under [locale] at all; /admin (an
// internal staff tool with no Arabic translations planned) and /api
// (never rendered) sit outside this entirely and are untouched by it.
export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

// Resolves a logical (locale-free) path like "/book" into the real URL for
// a given locale ("/book" for the default "en", "/ar/book" otherwise) —
// "as-needed" prefixing done by hand, for the handful of spots that need
// a real, complete href instead of letting next-intl's own Link/router
// add the prefix automatically: Auth.js's callbackUrl (GoogleSignInButton)
// and the plain next/navigation redirects used for already-resolved `next`
// query values (see the proxy.ts / login+register page comments on why
// those specifically don't go through the locale-aware router).
export function localizeHref(locale: string, path: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}
