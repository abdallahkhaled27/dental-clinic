import type { Appointment, Dentist } from "@prisma/client";
import { prisma } from "./prisma";
import type { NewAppointmentInput } from "./appointments";

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
