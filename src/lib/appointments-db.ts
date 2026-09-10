import { Prisma, type Appointment, type Dentist } from "@prisma/client";
import { prisma } from "./prisma";
import type { NewAppointmentInput } from "./appointments";

// Which of the two unique constraints on Appointment (see schema.prisma)
// a failed create violated, so callers can give a message the patient (or
// the chatbot, on their behalf) can actually act on instead of a generic
// "something went wrong". Returns null for any other kind of error.
//
// The constraint name lives a few levels deep in the driver adapter's own
// error shape (@prisma/adapter-pg wraps the raw Postgres error rather than
// Prisma normalizing it the way it does for the built-in engine) — found
// by triggering both conflicts directly and inspecting `error.meta`.
export function getSlotConflictKind(
  error: unknown,
): "dentist" | "patient" | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }
  const constraint = (
    error.meta as { driverAdapterError?: { cause?: { constraint?: { index?: string } } } }
  )?.driverAdapterError?.cause?.constraint?.index;

  if (constraint === "Appointment_dentistId_date_time_key") return "dentist";
  if (constraint === "Appointment_patientId_date_time_key") return "patient";
  return null;
}

export type AppointmentWithDentist = Appointment & { dentist: Dentist };

// Server-only: writes to Postgres via Prisma. Only import this from Route
// Handlers, Server Components, or other server-side code — never from a
// Client Component (see the note in appointments.ts).
//
// patientId comes from the caller's verified session, never from the
// request body — see the route handlers for why (a client-supplied
// patientId would let anyone attribute a booking to someone else's
// account).
export function createAppointment(
  input: NewAppointmentInput,
  patientId: string,
): Promise<Appointment> {
  return prisma.appointment.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      serviceId: input.serviceId,
      dentistId: input.dentistId,
      patientId,
      date: input.date,
      time: input.time,
      notes: input.notes?.trim() ?? "",
    },
  });
}

export function getAppointments(): Promise<AppointmentWithDentist[]> {
  return prisma.appointment.findMany({
    orderBy: { date: "asc" },
    include: { dentist: true },
  });
}

export function getAppointmentsForPatient(
  patientId: string,
): Promise<AppointmentWithDentist[]> {
  return prisma.appointment.findMany({
    where: { patientId },
    orderBy: { date: "asc" },
    include: { dentist: true },
  });
}
