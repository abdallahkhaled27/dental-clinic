import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppointmentsForPatient } from "@/lib/appointments-db";
import { timeSlots } from "@/lib/appointments";
import { services } from "@/lib/clinic-data";
import { verifyPatientSession } from "@/lib/patient-auth";

export const metadata: Metadata = {
  title: "My Appointments | Bright Smile Dental",
};

// Same reasoning as /admin: always fetch fresh, never prerender.
export const dynamic = "force-dynamic";

function serviceName(serviceId: string) {
  return services.find((service) => service.id === serviceId)?.name ?? serviceId;
}

export default async function PatientDashboardPage() {
  // proxy.ts already checks this — this is the second, independent check
  // directly in front of the data itself (same pattern as /admin).
  const session = await verifyPatientSession();
  if (!session) {
    redirect("/patient/login?next=/patient/dashboard");
  }

  const appointments = await getAppointmentsForPatient(session.patientId);

  // "9:00 AM" vs "10:00 AM" doesn't sort correctly as plain text — see the
  // identical sort on the admin page for why.
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {session.email}
          </p>
        </div>
        <form action="/api/patient/logout" method="POST">
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-foreground/5"
          >
            Log out
          </button>
        </form>
      </div>

      {sortedAppointments.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any appointments yet.
          </p>
          <Link
            href="/book"
            className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            Book Appointment
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {sortedAppointments.map((appointment) => (
            <li
              key={appointment.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold">
                  {serviceName(appointment.serviceId)}
                </span>
                <span className="text-sm font-medium tabular-nums text-primary">
                  {appointment.date} at {appointment.time}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                With {appointment.dentist.name} — {appointment.dentist.specialty}
              </p>
              {appointment.notes && (
                <p className="mt-2 border-t border-border pt-2 text-sm text-muted-foreground">
                  {appointment.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
