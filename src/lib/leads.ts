import type { Lead } from "@prisma/client";
import { isValidContact } from "./validation";

// This module holds pure, dependency-free logic (types, constants,
// validation) that's safe to import from Client Components — LeadStatusSelect
// needs leadStatuses/LeadStatus/isValidLeadStatus to render its dropdown.
// Anything that touches the database lives in leads-db.ts instead, the same
// split as appointments.ts / appointments-db.ts: a Client Component must
// never import that file, or Next.js will try to bundle the Postgres driver
// into browser JS and fail to build.
export type { Lead };

export type NewLeadInput = {
  name: string;
  contact: string;
  interest: string;
};

// The lifecycle a lead moves through once staff start following up.
// `createLead` always starts a lead at "new" (the schema default) — these
// are the only other states the admin dashboard lets staff move it to.
export const leadStatuses = ["new", "contacted", "converted", "lost"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export function isValidLeadStatus(status: unknown): status is LeadStatus {
  return typeof status === "string" && (leadStatuses as readonly string[]).includes(status);
}

export function validateLead(input: Partial<NewLeadInput>): string | null {
  if (!input.name?.trim()) return "Name is required.";
  if (!input.contact?.trim() || !isValidContact(input.contact)) {
    return "A valid email or phone number is required.";
  }
  if (!input.interest?.trim()) return "A note on their interest is required.";
  return null;
}
