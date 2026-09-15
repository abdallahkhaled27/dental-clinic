import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { localizeHref } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getAppointmentsForPatient } from "@/lib/appointments-db";
import { timeSlots } from "@/lib/appointments";
import { verifyPatientSession } from "@/lib/patient-auth";
import PayDepositButton from "@/components/PayDepositButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.dashboard" });
  // A patient's own appointments — never anything a search result should
  // point to, on top of already being behind a login.
  return { title: t("title"), robots: { index: false, follow: false } };
}

// Same reasoning as /admin: always fetch fresh, never prerender.
export const dynamic = "force-dynamic";

export default async function PatientDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ deposit?: string }>;
}) {
  // proxy.ts already checks this — this is the second, independent check
  // directly in front of the data itself (same pattern as /admin).
  const session = await verifyPatientSession();
  if (!session) {
    const locale = await getLocale();
    redirect(`${localizeHref(locale, "/login")}?next=${encodeURIComponent("/dashboard")}`);
  }

  const [appointments, t, locale, { deposit }] = await Promise.all([
    getAppointmentsForPatient(session.patientId),
    getTranslations("Dashboard"),
    getLocale(),
    searchParams,
  ]);

  // "9:00 AM" vs "10:00 AM" doesn't sort correctly as plain text — see the
  // identical sort on the admin page for why.
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Logging out lives in the header nav (see PatientNavLink) —
          reachable from every page, not just this one, so it isn't
          repeated here. */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("signedInAs", { email: session.email })}
        </p>
      </div>

      {/* The redirect back from Stripe (success_url/cancel_url in
          payments.ts) — a UX nicety only. The webhook, not this query
          param, is what actually marks a deposit paid (see the model
          comment on depositStatus), so this banner can't claim more than
          "we're processing it" even on the success path. */}
      {deposit === "success" && (
        <div className="mt-6 rounded-xl border border-success-border bg-success-bg p-4 text-sm">
          {t("depositSuccessBanner")}
        </div>
      )}
      {deposit === "canceled" && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
          {t("depositCanceledBanner")}
        </div>
      )}

      {sortedAppointments.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Link
            href="/book"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            {t("bookAppointment")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {sortedAppointments.map((appointment) => {
            const serviceName = locale === "ar" ? appointment.service.nameAr : appointment.service.name;
            return (
              <li
                key={appointment.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{serviceName}</span>
                  <span className="text-sm font-medium tabular-nums text-primary">
                    {appointment.date} at {appointment.time}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {t("with", { dentist: appointment.dentist.name, specialty: appointment.dentist.specialty })}
                </p>
                {appointment.notes && (
                  <p className="mt-2 border-t border-border pt-2 text-sm text-muted-foreground">
                    {appointment.notes}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                  {appointment.depositStatus === "paid" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
                      {t("depositPaid")}
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {t("depositPending")}
                      </span>
                      <PayDepositButton appointmentId={appointment.id} />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
