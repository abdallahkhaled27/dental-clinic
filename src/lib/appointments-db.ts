import type { Appointment, Dentist } from "@prisma/client";
import { prisma } from "./prisma";
import type { NewAppointmentInput } from "./appointments";

export type AppointmentWithDentist = Appointment & { dentist: Dentist };

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
      dentistId: input.dentistId,
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
