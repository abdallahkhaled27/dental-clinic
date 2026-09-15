import { NextResponse } from "next/server";
import { getAppointmentsNeedingReminder, markReminderSent } from "@/lib/appointments-db";
import { sendAppointmentReminderEmail } from "@/lib/email";
import { getClinicTomorrow, siteUrl, depositAmountEgp } from "@/lib/clinic-data";
import { createDepositCheckoutSession } from "@/lib/payments";

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
      // A stale, unpaid deposit gets a fresh checkout link here — the one
      // from booking time is almost certainly an expired Stripe session
      // by now (Checkout sessions expire after 24 hours). No request
      // origin to read from on a cron trigger, so siteUrl stands in for
      // it; locale isn't tracked on the appointment itself, so this
      // always renders in English regardless of which language the
      // patient originally booked in.
      const checkoutUrl =
        appointment.depositStatus === "pending"
          ? await createDepositCheckoutSession(appointment, siteUrl, "en").catch((error) => {
              console.error(
                `Failed to create a reminder deposit link for appointment ${appointment.id}:`,
                error,
              );
              return null;
            })
          : null;

      await sendAppointmentReminderEmail({
        to: appointment.email,
        patientName: appointment.name,
        serviceName: appointment.service.name,
        dentistName: appointment.dentist.name,
        date: appointment.date,
        time: appointment.time,
        depositAmountEgp,
        checkoutUrl,
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
