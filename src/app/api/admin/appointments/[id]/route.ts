import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  validateAppointmentEdit,
  hoursUntilAppointment,
  type AppointmentEditInput,
} from "@/lib/appointments";
import {
  updateAppointment,
  deleteAppointment,
  getAppointmentById,
  getSlotConflictKind,
} from "@/lib/appointments-db";
import { getDentists } from "@/lib/dentists";
import { refundDeposit } from "@/lib/payments";
import { cancellationNoticeHours } from "@/lib/clinic-data";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Same inline-check pattern as every other route handler — proxy.ts
  // only protects page routes, not /api/*.
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  let body: Partial<AppointmentEditInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const dentists = await getDentists();
  const validationError = validateAppointmentEdit(
    body,
    dentists.map((d) => d.id),
  );
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const appointment = await updateAppointment(id, body as AppointmentEditInput);
    return NextResponse.json({ appointment });
  } catch (error) {
    const conflict = getSlotConflictKind(error);
    if (conflict === "dentist") {
      return NextResponse.json(
        { error: "That dentist is already booked at that date and time." },
        { status: 409 },
      );
    }
    if (conflict === "patient") {
      return NextResponse.json(
        { error: "This patient already has a different appointment at that date and time." },
        { status: 409 },
      );
    }
    console.error("Failed to update appointment:", error);
    return NextResponse.json(
      { error: "Something went wrong saving those changes. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  const appointment = await getAppointmentById(id);
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  // A paid deposit only gets refunded on cancellation with at least
  // cancellationNoticeHours' notice — matching the cancellation-policy
  // knowledge base entry patients already see. Refunding unconditionally
  // would mean the deposit never actually costs anything to no-show or
  // cancel last-minute, defeating the entire point of charging one.
  const withinNoticeWindow =
    hoursUntilAppointment(appointment.date, appointment.time) >= cancellationNoticeHours;

  if (appointment.depositStatus === "paid" && withinNoticeWindow) {
    try {
      await refundDeposit(appointment);
    } catch (error) {
      console.error("Failed to refund deposit before cancelling appointment:", error);
      return NextResponse.json(
        {
          error:
            "This appointment has a paid deposit that couldn't be refunded automatically, so it wasn't cancelled. Please refund it in the Stripe dashboard and try again.",
        },
        { status: 502 },
      );
    }
  }

  try {
    await deleteAppointment(id);
    return NextResponse.json({
      success: true,
      depositForfeited: appointment.depositStatus === "paid" && !withinNoticeWindow,
    });
  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    return NextResponse.json(
      { error: "Something went wrong cancelling that appointment. Please try again." },
      { status: 500 },
    );
  }
}
