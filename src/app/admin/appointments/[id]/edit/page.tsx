import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getAppointmentById } from "@/lib/appointments-db";
import { getDentists } from "@/lib/dentists";
import { services } from "@/lib/clinic-data";
import EditAppointmentForm from "@/components/EditAppointmentForm";

export const metadata: Metadata = {
  title: "Edit Appointment | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

function serviceName(serviceId: string) {
  return services.find((service) => service.id === serviceId)?.name ?? serviceId;
}

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  if (!session) {
    redirect("/admin/login?next=/admin");
  }

  const { id } = await params;
  const [appointment, dentists] = await Promise.all([
    getAppointmentById(id),
    getDentists(),
  ]);

  if (!appointment) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link
        href="/admin"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Edit Appointment</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {appointment.name} — {serviceName(appointment.serviceId)}
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <EditAppointmentForm
          appointmentId={appointment.id}
          dentists={dentists}
          defaultDentistId={appointment.dentistId}
          defaultDate={appointment.date}
          defaultTime={appointment.time}
          defaultNotes={appointment.notes}
        />
      </div>
    </main>
  );
}
