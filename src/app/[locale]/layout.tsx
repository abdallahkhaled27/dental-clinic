import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

// The nested layout for the entire patient-facing (site) tree — /admin
// sits outside [locale] and never goes through this file. Doesn't render
// <html>/<body> itself (the shared root at app/layout.tsx already does,
// see the note there on why); this only validates the locale and hands
// the resolved messages down via NextIntlClientProvider.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Lets next-intl statically render as much as possible per locale
  // instead of forcing every localized page dynamic.
  setRequestLocale(locale);

  return <NextIntlClientProvider>{children}</NextIntlClientProvider>;
}
