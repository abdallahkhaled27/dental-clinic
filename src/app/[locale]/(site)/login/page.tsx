import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { localizeHref } from "@/i18n/routing";
import { verifyPatientSession } from "@/lib/patient-auth";
import PatientLoginForm from "@/components/PatientLoginForm";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export const metadata: Metadata = {
  title: "Login | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

// Contract for `next` (this file) / `redirectTo` (passed to the client
// forms below): always a logical, locale-free path like "/dashboard" —
// never "/ar/dashboard". Everything that later navigates using it goes
// through next-intl's locale-aware Link/router (which adds the right
// prefix itself from a logical path), except the two spots that hand off
// to something outside Next's own router entirely — this page's own
// already-signed-in redirect below, and Auth.js's callbackUrl in
// GoogleSignInButton — which resolve it to a real href by hand via
// localizeHref instead.
export default async function PatientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only ever redirect within our own site — an unvalidated `next` value
  // could otherwise be used to bounce a signed-in patient off to an
  // attacker-controlled URL.
  const redirectTo = next?.startsWith("/") ? next : "/dashboard";

  const session = await verifyPatientSession();
  if (session) {
    const locale = await getLocale();
    redirect(localizeHref(locale, redirectTo));
  }

  const t = await getTranslations("Auth");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">{t("loginTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("loginSubtitle")}</p>
        <div className="mt-8">
          <GoogleSignInButton redirectTo={redirectTo} />
        </div>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          {t("or")}
          <div className="h-px flex-1 bg-border" />
        </div>
        <PatientLoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
