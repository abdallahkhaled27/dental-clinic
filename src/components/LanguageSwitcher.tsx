"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { localizeHref } from "@/i18n/routing";

// Shows the *other* language's own name for itself — "العربية" while
// reading the English site, "English" while reading the Arabic one — not
// a translated label, since a language's name is always written in
// itself regardless of which locale is currently active.
//
// A plain <a>, not next/link or next-intl's Link — either would do a
// client-side navigation that reuses the already-rendered root layout,
// but app/layout.tsx sets <html lang>/<html dir> by reading a header at
// render time (see the note there on why it can't use a [locale] route
// param), and Next has no way to know that output depends on the URL
// changing. Confirmed by an actual E2E test failure: dir stayed "ltr"
// after a client-side nav into /ar. A full navigation re-runs the root
// layout for real, which is the only way it recomputes correctly — a
// deliberate, acceptable trade-off for a deliberate, infrequent action
// like switching languages, not something worth losing SPA navigation
// for anywhere else.
export default function LanguageSwitcher({ onClick }: { onClick?: () => void }) {
  const locale = useLocale();
  const pathname = usePathname();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <a
      href={localizeHref(nextLocale, pathname)}
      onClick={() => {
        // Also caught by a real E2E test: visiting /ar/anything sets a
        // NEXT_LOCALE=ar cookie (next-intl's own doing, for remembering a
        // visitor's locale across plain unprefixed links from outside the
        // site). Without updating it here too, clicking "English" would
        // navigate to the correct unprefixed /login — and next-intl's own
        // middleware would then see the stale "ar" cookie disagreeing
        // with that URL and 307 it straight back to /ar/login, silently
        // undoing the click. Setting it to match what's actually being
        // navigated to keeps the two in sync.
        document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; samesite=lax`;
        onClick?.();
      }}
      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
    >
      {nextLocale === "ar" ? "العربية" : "English"}
    </a>
  );
}
