import { Prisma, type Dentist } from "@prisma/client";
import { prisma } from "./prisma";

// Server-only: reads from Postgres via Prisma. Never import this from a
// Client Component (see the note in appointments.ts for why).
export function getDentists(): Promise<Dentist[]> {
  return prisma.dentist.findMany({ orderBy: { name: "asc" } });
}

export function getDentistById(id: string): Promise<Dentist | null> {
  return prisma.dentist.findUnique({ where: { id } });
}

export type NewDentistInput = {
  name: string;
  specialty: string;
};

export function validateDentist(input: Partial<NewDentistInput>): string | null {
  if (!input.name?.trim()) return "Name is required.";
  if (!input.specialty?.trim()) return "Specialty is required.";
  return null;
}

export function createDentist(input: NewDentistInput): Promise<Dentist> {
  return prisma.dentist.create({
    data: { name: input.name.trim(), specialty: input.specialty.trim() },
  });
}

export function updateDentist(id: string, input: NewDentistInput): Promise<Dentist> {
  return prisma.dentist.update({
    where: { id },
    data: { name: input.name.trim(), specialty: input.specialty.trim() },
  });
}

export function deleteDentist(id: string): Promise<Dentist> {
  return prisma.dentist.delete({ where: { id } });
}

// True when a dentist couldn't be deleted because they still have
// appointments pointing at them — Appointment.dentistId is
// ON DELETE RESTRICT (see the add_dentist_support migration), so Postgres
// refuses the delete outright rather than silently orphaning or cascading
// through a patient's booking history. Lets the API route turn that raw FK
// violation into a message staff can actually act on.
export function isDentistInUseError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}
