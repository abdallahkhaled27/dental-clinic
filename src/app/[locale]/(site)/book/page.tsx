import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { localizeHref } from "@/i18n/routing";
import BookingForm from "@/components/BookingForm";
import { getDentists } from "@/lib/dentists";
import { verifyPatientSession } from "@/lib/patient-auth";

// Excluded from robots.txt already (see app/robots.ts) — noindex here too
// as a direct, page-level signal: a patient's own booking form has no
// content that should ever show up in search results.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.book" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// The dentist list now comes from the database (see schema.prisma) rather
// than static code, so this page needs a live DB connection per request —
// same reasoning as the admin page's `force-dynamic`.
export const dynamic = "force-dynamic";

export default async function BookPage() {
  // proxy.ts already redirects signed-out visitors before the request
  // reaches here — this is the second, independent check directly in
  // front of the page itself (same belt-and-suspenders pattern as /admin).
  const session = await verifyPatientSession();
  if (!session) {
    const locale = await getLocale();
    redirect(`${localizeHref(locale, "/login")}?next=${encodeURIComponent("/book")}`);
  }

  const [dentists, t] = await Promise.all([getDentists(), getTranslations("Booking")]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-balance">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <BookingForm
          dentists={dentists}
          defaultName={session.name}
          defaultEmail={session.email}
        />
      </div>
    </main>
  );
}
