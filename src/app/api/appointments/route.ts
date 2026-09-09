import { NextResponse } from "next/server";
import { validateAppointment, type NewAppointmentInput } from "@/lib/appointments";
import { createAppointment } from "@/lib/appointments-db";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 5 bookings per minute per IP — a real patient books once, not in bulk.
  if (isRateLimited(`appointments:${getClientKey(request)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
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

  const validationError = validateAppointment(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const appointment = await createAppointment(body as NewAppointmentInput);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return NextResponse.json(
      { error: "Something went wrong saving your appointment. Please try again." },
      { status: 500 },
    );
  }
}
