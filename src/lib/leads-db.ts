import type { Lead } from "@prisma/client";
import { prisma } from "./prisma";
import type { LeadStatus, NewLeadInput } from "./leads";

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

export function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  return prisma.lead.update({ where: { id }, data: { status } });
}
