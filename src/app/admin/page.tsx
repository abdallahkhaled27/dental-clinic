import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppointments } from "@/lib/appointments-db";
import { timeSlots } from "@/lib/appointments";
import { services } from "@/lib/clinic-data";
import { getLeads } from "@/lib/leads-db";
import { getPatientsWithAppointmentCount } from "@/lib/patients";
import { getDentists } from "@/lib/dentists";
import { getKnowledgeChunks } from "@/lib/knowledge-db";
import { verifySession } from "@/lib/auth";
import DeletePatientButton from "@/components/DeletePatientButton";
import DeleteAppointmentButton from "@/components/DeleteAppointmentButton";
import DeleteDentistButton from "@/components/DeleteDentistButton";
import DeleteLeadButton from "@/components/DeleteLeadButton";
import DeleteKnowledgeButton from "@/components/DeleteKnowledgeButton";
import LeadStatusSelect from "@/components/LeadStatusSelect";
import { isValidLeadStatus } from "@/lib/leads";

export const metadata: Metadata = {
  title: "Staff Dashboard | Bright Smile Dental",
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
    redirect("/admin/login?next=/admin");
  }

  const [appointments, leads, patients, dentists, knowledgeChunks] = await Promise.all([
    getAppointments(),
    getLeads(),
    getPatientsWithAppointmentCount(),
    getDentists(),
    getKnowledgeChunks(),
  ]);

  // Prisma already sorted by date, but "9:00 AM" vs "10:00 AM" doesn't sort
  // correctly as plain text (the "1" in "10" sorts before "9"). timeSlots is
  // already in the right order, so we sort by each slot's position in it.
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return timeSlots.indexOf(a.time) - timeSlots.indexOf(b.time);
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {session.email}
          </p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-foreground/5"
          >
            Log out
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Appointments booked</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{sortedAppointments.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Leads awaiting follow-up</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Patient accounts</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{patients.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Dentists</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{dentists.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Knowledge base entries</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">{knowledgeChunks.length}</p>
        </div>
      </div>

      <h2 className="mt-12 text-lg font-semibold tracking-tight">Appointments</h2>

      {sortedAppointments.length === 0 ? (
        <EmptyState message="No appointments yet." />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02] text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Dentist</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Booked</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="border-b border-border align-top last:border-0 hover:bg-foreground/[0.02]"
                >
                  <td className="px-4 py-3 font-medium">{appointment.name}</td>
                  <td className="px-4 py-3">
                    <div>{appointment.email}</div>
                    <div className="text-muted-foreground">{appointment.phone}</div>
                  </td>
                  <td className="px-4 py-3">{serviceName(appointment.serviceId)}</td>
                  <td className="px-4 py-3">{appointment.dentist.name}</td>
                  <td className="px-4 py-3 tabular-nums">{appointment.date}</td>
                  <td className="px-4 py-3 tabular-nums">{appointment.time}</td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">
                    {appointment.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(appointment.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/appointments/${appointment.id}/edit`}
                        className="text-sm text-primary transition-opacity hover:opacity-70"
                      >
                        Edit
                      </Link>
                      <DeleteAppointmentButton
                        appointmentId={appointment.id}
                        patientName={appointment.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-12 text-lg font-semibold tracking-tight">Leads</h2>

      {leads.length === 0 ? (
        <EmptyState message="No leads yet." />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02] text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Interested in</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Captured</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-border align-top last:border-0 hover:bg-foreground/[0.02]"
                >
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3">{lead.contact}</td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">{lead.interest}</td>
                  <td className="px-4 py-3">
                    {isValidLeadStatus(lead.status) ? (
                      <LeadStatusSelect leadId={lead.id} status={lead.status} />
                    ) : (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {lead.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-12 text-lg font-semibold tracking-tight">Patients</h2>

      {patients.length === 0 ? (
        <EmptyState message="No patient accounts yet." />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02] text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Appointments</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-border align-top last:border-0 hover:bg-foreground/[0.02]"
                >
                  <td className="px-4 py-3 font-medium">{patient.name}</td>
                  <td className="px-4 py-3">{patient.email}</td>
                  <td className="px-4 py-3 tabular-nums">{patient._count.appointments}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(patient.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <DeletePatientButton patientId={patient.id} patientName={patient.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Dentists</h2>
        <Link
          href="/admin/dentists/new"
          className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-foreground/5"
        >
          Add dentist
        </Link>
      </div>

      {dentists.length === 0 ? (
        <EmptyState message="No dentists yet." />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02] text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {dentists.map((dentist) => (
                <tr
                  key={dentist.id}
                  className="border-b border-border align-top last:border-0 hover:bg-foreground/[0.02]"
                >
                  <td className="px-4 py-3 font-medium">{dentist.name}</td>
                  <td className="px-4 py-3">{dentist.specialty}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/dentists/${dentist.id}/edit`}
                        className="text-sm text-primary transition-opacity hover:opacity-70"
                      >
                        Edit
                      </Link>
                      <DeleteDentistButton dentistId={dentist.id} dentistName={dentist.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Knowledge Base</h2>
        <Link
          href="/admin/knowledge/new"
          className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-foreground/5"
        >
          Add entry
        </Link>
      </div>

      {knowledgeChunks.length === 0 ? (
        <EmptyState message="No knowledge base entries yet." />
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02] text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Topic</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {knowledgeChunks.map((chunk) => (
                <tr
                  key={chunk.id}
                  className="border-b border-border align-top last:border-0 hover:bg-foreground/[0.02]"
                >
                  <td className="px-4 py-3 font-medium">{chunk.topic}</td>
                  <td className="max-w-md px-4 py-3 text-muted-foreground">
                    {chunk.content.length > 140
                      ? `${chunk.content.slice(0, 140)}…`
                      : chunk.content}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/knowledge/${chunk.id}/edit`}
                        className="text-sm text-primary transition-opacity hover:opacity-70"
                      >
                        Edit
                      </Link>
                      <DeleteKnowledgeButton chunkId={chunk.id} topic={chunk.topic} />
                    </div>
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
