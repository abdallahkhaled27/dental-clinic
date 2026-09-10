import { NextResponse } from "next/server";
import { getAppointmentsNeedingReminder, markReminderSent } from "@/lib/appointments-db";
import { sendAppointmentReminderEmail } from "@/lib/email";
import { services, getClinicTomorrow } from "@/lib/clinic-data";

// Triggered once a day by Vercel Cron (see vercel.json) — not reachable by
// a patient or a browser. Anyone who *does* guess the URL still can't
// trigger it without CRON_SECRET, which only Vercel's scheduler and this
// project's own env know.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = getClinicTomorrow();
  const appointments = await getAppointmentsNeedingReminder(tomorrow);

  let sent = 0;
  let failed = 0;

  // Sequential, not Promise.all: this runs once a day against a handful
  // of rows, not a hot path — no reason to fan out dozens of concurrent
  // Resend calls, and one slow/failed send shouldn't affect how the others
  // are retried or reported.
  for (const appointment of appointments) {
    try {
      await sendAppointmentReminderEmail({
        to: appointment.email,
        patientName: appointment.name,
        serviceName: services.find((s) => s.id === appointment.serviceId)?.name ?? appointment.serviceId,
        dentistName: appointment.dentist.name,
        date: appointment.date,
        time: appointment.time,
      });
      await markReminderSent(appointment.id);
      sent += 1;
    } catch (error) {
      console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
      failed += 1;
    }
  }

  return NextResponse.json({ date: tomorrow, sent, failed, total: appointments.length });
}
