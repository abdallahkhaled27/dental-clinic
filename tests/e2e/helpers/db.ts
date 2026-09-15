import { hash } from "bcryptjs";
import { prisma } from "../../../src/lib/prisma";

// Every test in this suite creates its own patient/staff accounts rather
// than relying on seeded or shared ones — this prefix is what makes them
// unambiguously test data, safe to sweep up without risking a real
// account, and easy to spot by hand in the database if a cleanup call
// ever gets skipped (a failed test, an interrupted run).
const TEST_TAG = "pw-test";

// @example.com is deliberate, not a placeholder to swap out: it's a
// reserved, non-deliverable domain (RFC 2606) — exactly what test data
// should use, and portable to anyone who clones this repo and runs the
// suite themselves. Resend's API rejects it with a logged 422 ("use our
// testing email address instead"), which is expected noise, not a
// failure: sending a confirmation email is best-effort everywhere in this
// app (see email.ts) precisely so an undeliverable address never blocks
// the booking/registration it's attached to — these tests are actually
// exercising that fallback, not hitting a bug.
export function testEmail(scenario: string): string {
  return `${TEST_TAG}-${scenario}-${Date.now()}@example.com`;
}

export async function deletePatientByEmail(email: string): Promise<void> {
  const patient = await prisma.patient.findUnique({ where: { email } });
  if (!patient) return;
  await prisma.appointment.deleteMany({ where: { patientId: patient.id } });
  await prisma.patientSession.deleteMany({ where: { patientId: patient.id } });
  await prisma.passwordResetToken.deleteMany({ where: { patientId: patient.id } });
  await prisma.patient.delete({ where: { id: patient.id } });
}

// Creates a real, working staff login for the admin-auth tests — the app
// has no public staff sign-up (see prisma/create-admin.ts), so a test that
// needs to actually sign in as staff has to seed one directly the same
// way that script does, not through the UI.
export async function createTestStaff(
  email: string,
  password: string,
): Promise<void> {
  const passwordHash = await hash(password, 10);
  await prisma.staffUser.create({ data: { email, passwordHash } });
}

export async function deleteStaffByEmail(email: string): Promise<void> {
  const staff = await prisma.staffUser.findUnique({ where: { email } });
  if (!staff) return;
  await prisma.session.deleteMany({ where: { userId: staff.id } });
  await prisma.staffUser.delete({ where: { id: staff.id } });
}

// The booking tests need at least one real dentist to pick from — on a
// completely fresh database (a first-time clone, or CI's ephemeral
// Postgres service, which starts genuinely empty since prisma/seed.ts
// only seeds the knowledge base), there isn't one yet, and nothing else
// creates one. Idempotent: does nothing if a dentist already exists, so
// this never touches an existing local dev database's real roster.
export async function ensureDentistExists(): Promise<void> {
  const existing = await prisma.dentist.findFirst();
  if (existing) return;
  await prisma.dentist.create({
    data: { name: "Dr. Playwright Seed", specialty: "General Dentistry" },
  });
}

// A date two weeks out that isn't a Friday or Saturday in the *clinic's*
// timezone — same Africa/Cairo anchoring the app itself uses (see
// getClinicToday/closedWeekdays in clinic-data.ts), not the test runner's
// local zone, which could disagree with Cairo about which weekday a date
// near midnight actually is and make an otherwise-valid booking flaky.
export function futureOpenDateString(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 14);
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "short",
  });
  while (["Fri", "Sat"].includes(weekdayFormatter.format(date))) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(date);
}
