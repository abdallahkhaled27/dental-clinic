import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAppointments } from "@/lib/appointments-db";
import { timeSlots } from "@/lib/appointments";
import { services } from "@/lib/clinic-data";
import { getLeads } from "@/lib/leads";
import { verifySession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin | Bright Smile Dental",
};

// Always render this page fresh per request — never prerender it at build
// time (which would either bake in stale data or, since Prisma needs a live
// database connection, fail the build if Postgres isn't reachable) or cache
// it (which would show stale appointments to staff).
export const dynamic = "force-dynamic";

function serviceName(serviceId: string) {
  return services.find((service) => service.id === serviceId)?.name ?? serviceId;
}

export default async function AdminPage() {
  // proxy.ts already checks this before the request even reaches here —
  // this is a second, independent check directly in front of the data
  // itself. Belt and suspenders: if a future route ever isn't covered by
  // the proxy matcher, this line is still what actually stops it.
  const session = await verifySession();
  if (!session) {
    redirect("/login");
  }

  const [appointments, leads] = await Promise.all([getAppointments(), getLeads()]);

  // Prisma already sorted by date, but "9:00 AM" vs "10:00 AM" doesn't sort
  // correctly as plain text (the "1" in "10" sorts before "9"). timeSlots is
  // already in the right order, so we sort by each slot's position in it.
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between">
        <span className="text-sm opacity-70">Signed in as {session.email}</span>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="rounded-full border border-black/10 px-4 py-1.5 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            Log out
          </button>
        </form>
      </div>

      <h1 className="mt-8 text-3xl font-bold tracking-tight">Appointments</h1>
      <p className="mt-2 opacity-70">
        {sortedAppointments.length} appointment
        {sortedAppointments.length === 1 ? "" : "s"} booked
      </p>

      {sortedAppointments.length === 0 ? (
        <p className="mt-10 opacity-70">No appointments yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="py-2 pr-4 font-medium">Patient</th>
                <th className="py-2 pr-4 font-medium">Contact</th>
                <th className="py-2 pr-4 font-medium">Service</th>
                <th className="py-2 pr-4 font-medium">Dentist</th>
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Time</th>
                <th className="py-2 pr-4 font-medium">Notes</th>
                <th className="py-2 pr-4 font-medium">Booked</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="border-b border-black/5 align-top dark:border-white/5"
                >
                  <td className="py-3 pr-4">{appointment.name}</td>
                  <td className="py-3 pr-4">
                    <div>{appointment.email}</div>
                    <div className="opacity-70">{appointment.phone}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {serviceName(appointment.serviceId)}
                  </td>
                  <td className="py-3 pr-4">{appointment.dentist.name}</td>
                  <td className="py-3 pr-4">{appointment.date}</td>
                  <td className="py-3 pr-4">{appointment.time}</td>
                  <td className="max-w-xs py-3 pr-4">
                    {appointment.notes || "—"}
                  </td>
                  <td className="py-3 pr-4 opacity-70">
                    {new Date(appointment.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-16 text-2xl font-bold tracking-tight">Leads</h2>
      <p className="mt-2 opacity-70">
        {leads.length} {leads.length === 1 ? "person" : "people"} interested,
        not yet booked
      </p>

      {leads.length === 0 ? (
        <p className="mt-10 opacity-70">No leads yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left dark:border-white/10">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Contact</th>
                <th className="py-2 pr-4 font-medium">Interested in</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Captured</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-black/5 align-top dark:border-white/5"
                >
                  <td className="py-3 pr-4">{lead.name}</td>
                  <td className="py-3 pr-4">{lead.contact}</td>
                  <td className="max-w-xs py-3 pr-4">{lead.interest}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-black/5 px-2 py-1 text-xs dark:bg-white/10">
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 opacity-70">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
