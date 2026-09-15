import { Prisma, type Service } from "@prisma/client";
import { prisma } from "./prisma";

// Server-only: reads from Postgres via Prisma. Never import this from a
// Client Component (see the note in appointments.ts for why).
export function getServices(): Promise<Service[]> {
  return prisma.service.findMany({ orderBy: { createdAt: "asc" } });
}

export function getServiceById(id: string): Promise<Service | null> {
  return prisma.service.findUnique({ where: { id } });
}

export type NewServiceInput = {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
};

export function validateServiceInput(input: Partial<NewServiceInput>): string | null {
  if (!input.name?.trim()) return "English name is required.";
  if (!input.nameAr?.trim()) return "Arabic name is required.";
  if (!input.description?.trim()) return "English description is required.";
  if (!input.descriptionAr?.trim()) return "Arabic description is required.";
  return null;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "service"
  );
}

// Unlike Dentist's id (a random uuid), a Service's id is a readable slug
// derived from its English name — see the model comment in schema.prisma
// for why. Two services slugifying to the same thing (e.g. "Whitening"
// and "whitening!") would collide on the id, so this appends a number
// until it finds one that's free rather than failing outright.
export async function createService(input: NewServiceInput): Promise<Service> {
  const base = slugify(input.name);
  let id = base;
  let suffix = 1;
  while (await prisma.service.findUnique({ where: { id } })) {
    suffix += 1;
    id = `${base}-${suffix}`;
  }

  return prisma.service.create({
    data: {
      id,
      name: input.name.trim(),
      nameAr: input.nameAr.trim(),
      description: input.description.trim(),
      descriptionAr: input.descriptionAr.trim(),
    },
  });
}

export function updateService(id: string, input: NewServiceInput): Promise<Service> {
  return prisma.service.update({
    where: { id },
    data: {
      name: input.name.trim(),
      nameAr: input.nameAr.trim(),
      description: input.description.trim(),
      descriptionAr: input.descriptionAr.trim(),
    },
  });
}

export function deleteService(id: string): Promise<Service> {
  return prisma.service.delete({ where: { id } });
}

// Same pattern as isDentistInUseError — Appointment.serviceId is
// ON DELETE RESTRICT (see the add_service_table migration), so Postgres
// refuses the delete outright rather than orphaning appointment history.
export function isServiceInUseError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}
