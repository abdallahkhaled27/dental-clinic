import { NextResponse } from "next/server";
import { validateAppointment, type NewAppointmentInput } from "@/lib/appointments";
import { createAppointment } from "@/lib/appointments-db";
import { getDentists } from "@/lib/dentists";
import { verifyPatientSession } from "@/lib/patient-auth";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";
import { services } from "@/lib/clinic-data";
import { sendAppointmentConfirmationEmail } from "@/lib/email";

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

  let body: Partial<NewAppointmentInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const dentists = await getDentists();
  const validationError = validateAppointment(
    body,
    dentists.map((d) => d.id),
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
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return NextResponse.json(
      { error: "Something went wrong saving your appointment. Please try again." },
      { status: 500 },
    );
  }
}
