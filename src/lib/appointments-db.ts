import { Prisma, type Appointment, type Dentist } from "@prisma/client";
import { prisma } from "./prisma";
import type { NewAppointmentInput } from "./appointments";

// True when `error` is Postgres rejecting a create because the
// (dentistId, date, time) unique constraint was violated — i.e. someone
// else booked that exact slot with that dentist first. Callers use this
// to turn Prisma's raw P2002 into a message a patient can actually act on.
export function isSlotConflictError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
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
