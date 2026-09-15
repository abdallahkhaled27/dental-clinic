import { NextResponse } from "next/server";
import { verifyPatientSession } from "@/lib/patient-auth";
import { getAppointmentById } from "@/lib/appointments-db";
import { createDepositCheckoutSession } from "@/lib/payments";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

// Creates (or re-creates, for the "pay deposit" retry button on the
// dashboard) a Stripe Checkout session for an existing appointment's
// deposit. Booking itself already gets a session inline (see
// /api/appointments) — this is only for the case where a patient closed
// the tab, let it expire, or the session failed, and wants another link.
export async function POST(request: Request) {
  if (isRateLimited(`stripe-checkout:${getClientKey(request)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const session = await verifyPatientSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const appointmentId = typeof body?.appointmentId === "string" ? body.appointmentId : "";
  const locale = body?.locale === "ar" ? "ar" : "en";

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId is required." }, { status: 400 });
  }

  const appointment = await getAppointmentById(appointmentId);
  // Ownership check — without this, any signed-in patient could pay the
  // deposit for (and thus mark paid) someone else's appointment just by
  // guessing an ID.
  if (!appointment || appointment.patientId !== session.patientId) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  if (appointment.depositStatus === "paid") {
    return NextResponse.json({ error: "This deposit has already been paid." }, { status: 409 });
  }

  const url = await createDepositCheckoutSession(
    appointment,
    new URL(request.url).origin,
    locale,
  );

  if (!url) {
    return NextResponse.json(
      { error: "Online payment isn't available right now. Please call the clinic to pay your deposit." },
      { status: 503 },
    );
  }

  return NextResponse.json({ url });
}
