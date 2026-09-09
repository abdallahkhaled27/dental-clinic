import type { Dentist } from "@prisma/client";
import { prisma } from "./prisma";

// Server-only: reads from Postgres via Prisma. Never import this from a
// Client Component (see the note in appointments.ts for why).
export function getDentists(): Promise<Dentist[]> {
  return prisma.dentist.findMany({ orderBy: { name: "asc" } });
}
