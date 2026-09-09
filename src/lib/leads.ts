import type { Lead } from "@prisma/client";
import { prisma } from "./prisma";
import { isValidContact } from "./validation";

// Unlike appointments.ts, this file is never imported by a Client
// Component — only route.ts (chat) and the admin page (both server-only)
// touch leads — so there's no need to split pure logic from database
// access the way appointments.ts / appointments-db.ts do.

export type NewLeadInput = {
  name: string;
  contact: string;
  interest: string;
};

export function validateLead(input: Partial<NewLeadInput>): string | null {
  if (!input.name?.trim()) return "Name is required.";
  if (!input.contact?.trim() || !isValidContact(input.contact)) {
    return "A valid email or phone number is required.";
  }
  if (!input.interest?.trim()) return "A note on their interest is required.";
  return null;
}

export function createLead(input: NewLeadInput): Promise<Lead> {
  return prisma.lead.create({
    data: {
      name: input.name.trim(),
      contact: input.contact.trim(),
      interest: input.interest.trim(),
    },
  });
}

export function getLeads(): Promise<Lead[]> {
  return prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
}
