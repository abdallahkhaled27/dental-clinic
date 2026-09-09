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
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <span className="text-sm opacity-70">Signed in as {session.email}</span>
        <form action="/api/patient/logout" method="POST">
          <button
            type="submit"
            className="rounded-full border border-black/10 px-4 py-1.5 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            Log out
          </button>
        </form>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
        <Link
          href="/book"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Book Appointment
        </Link>
      </div>

      {sortedAppointments.length === 0 ? (
        <p className="mt-10 opacity-70">
          You don&apos;t have any appointments yet.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {sortedAppointments.map((appointment) => (
            <li
              key={appointment.id}
              className="rounded-lg border border-black/10 p-5 dark:border-white/10"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium">
                  {serviceName(appointment.serviceId)}
                </span>
                <span className="text-sm opacity-70">
                  {appointment.date} at {appointment.time}
                </span>
              </div>
              <p className="mt-1 text-sm opacity-70">
                With {appointment.dentist.name} — {appointment.dentist.specialty}
              </p>
              {appointment.notes && (
                <p className="mt-2 text-sm opacity-70">{appointment.notes}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
