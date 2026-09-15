import { NextResponse } from "next/server";
import { validateAppointment, type NewAppointmentInput } from "@/lib/appointments";
import { createAppointment, getSlotConflictKind } from "@/lib/appointments-db";
import { getDentists } from "@/lib/dentists";
import { getServices } from "@/lib/services";
import { verifyPatientSession } from "@/lib/patient-auth";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";
import { sendAppointmentConfirmationEmail, sendStaffNewAppointmentEmail } from "@/lib/email";
import { createDepositCheckoutSession } from "@/lib/payments";
import { depositAmountEgp } from "@/lib/clinic-data";

export async function POST(request: Request) {
  // 5 bookings per minute per IP — a real patient books once, not in bulk.
  if (isRateLimited(`appointments:${getClientKey(request)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  // Booking requires a patient account — the /book page already redirects
  // signed-out visitors to /login, but that's a UI convenience, not
  // enforcement. This is the actual gate: even a direct API request without
  // a valid session cookie is rejected here.
  const session = await verifyPatientSession();
  if (!session) {
    return NextResponse.json(
      { error: "Please sign in to book an appointment." },
      { status: 401 },
    );
  }

  let body: Partial<NewAppointmentInput> & { locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  const locale = body.locale === "ar" ? "ar" : "en";

  const [dentists, services] = await Promise.all([getDentists(), getServices()]);
  const validationError = validateAppointment(
    body,
    dentists.map((d) => d.id),
    services.map((s) => s.id),
  );
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const appointment = await createAppointment(
      body as NewAppointmentInput,
      session.patientId,
    );

    const dentist = dentists.find((d) => d.id === appointment.dentistId);
    const service = services.find((s) => s.id === appointment.serviceId);

    // Created before the confirmation email so that email can say the
    // right thing — "confirmed" if no deposit is owed, or "here's the
    // link to pay" if one is. A null checkoutUrl (Stripe unconfigured)
    // just means the booking is already fully confirmed. The appointment
    // itself is already saved regardless of what happens here or below.
    const checkoutUrl = await createDepositCheckoutSession(
      appointment,
      new URL(request.url).origin,
      locale,
    ).catch((error) => {
      console.error("Failed to create deposit checkout session:", error);
      return null;
    });

    // Awaited, not fire-and-forget: on Vercel, a serverless function's
    // execution can be frozen the moment the response is sent, so an
    // un-awaited promise isn't reliably guaranteed to finish sending. The
    // function itself never throws (see email.ts), so this only adds
    // latency, not a new failure mode.
    await sendAppointmentConfirmationEmail({
      to: appointment.email,
      patientName: appointment.name,
      serviceName: service?.name ?? appointment.serviceId,
      dentistName: dentist?.name ?? "your dentist",
      date: appointment.date,
      time: appointment.time,
      depositAmountEgp,
      checkoutUrl,
    });
    await sendStaffNewAppointmentEmail({
      patientName: appointment.name,
      patientEmail: appointment.email,
      patientPhone: appointment.phone,
      serviceName: service?.name ?? appointment.serviceId,
      dentistName: dentist?.name ?? "unknown dentist",
      date: appointment.date,
      time: appointment.time,
    });

    return NextResponse.json({ appointment, checkoutUrl }, { status: 201 });
  } catch (error) {
    const conflict = getSlotConflictKind(error);
    if (conflict === "dentist") {
      return NextResponse.json(
        { error: "That dentist is already booked at that date and time. Please pick a different time or dentist." },
        { status: 409 },
      );
    }
    if (conflict === "patient") {
      return NextResponse.json(
        { error: "You already have an appointment at that date and time. Please pick a different time." },
        { status: 409 },
      );
    }
    console.error("Failed to create appointment:", error);
    return NextResponse.json(
      { error: "Something went wrong saving your appointment. Please try again." },
      { status: 500 },
    );
  }
}
