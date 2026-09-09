import type { Appointment } from "@prisma/client";
import { prisma } from "./prisma";
import type { NewAppointmentInput } from "./appointments";

// Server-only: writes to Postgres via Prisma. Only import this from Route
// Handlers, Server Components, or other server-side code — never from a
// Client Component (see the note in appointments.ts).
export function createAppointment(
  input: NewAppointmentInput,
): Promise<Appointment> {
  return prisma.appointment.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      serviceId: input.serviceId,
      date: input.date,
      time: input.time,
      notes: input.notes?.trim() ?? "",
    },
  });
}

export function getAppointments(): Promise<Appointment[]> {
  return prisma.appointment.findMany({ orderBy: { date: "asc" } });
}
