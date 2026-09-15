import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { localizeHref } from "@/i18n/routing";
import { verifyPatientSession } from "@/lib/patient-auth";
import PatientRegisterForm from "@/components/PatientRegisterForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.register" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function PatientRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // See the identical check (and the "next"/"redirectTo" contract note)
  // on the login page for why this is validated and kept locale-free.
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
        <h1 className="text-2xl font-bold tracking-tight">{t("registerTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("registerSubtitle")}</p>
        <div className="mt-8">
          <PatientRegisterForm redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}
