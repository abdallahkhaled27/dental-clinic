import "server-only";
import crypto from "crypto";
import { hash, compare, hashSync } from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// A distinct cookie from staff's "session" — this is what keeps the two
// audiences fully separate. A patient's cookie is meaningless to
// getSessionByToken() in auth.ts (wrong table entirely), and vice versa.
const SESSION_COOKIE = "patient_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days — patients log in far less often than staff

// See auth.ts for why this exists: keeps a login attempt against an email
// that doesn't exist taking the same time as one that does.
const DUMMY_HASH = hashSync("no-such-account-timing-safety", 10);

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function startSession(patientId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.patientSession.create({ data: { token, patientId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

// Creates the account and immediately signs them in — a patient who just
// registered has no reason to fill out the login form again right after.
export async function registerPatient(
  name: string,
  email: string,
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const existing = await prisma.patient.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with that email already exists." };
  }

  const passwordHash = await hash(password, 10);
  const patient = await prisma.patient.create({
    data: { name, email, passwordHash },
  });

  await startSession(patient.id);
  return { success: true };
}

export async function attemptPatientLogin(
  email: string,
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const patient = await prisma.patient.findUnique({ where: { email } });
  const passwordMatches = await compare(password, patient?.passwordHash ?? DUMMY_HASH);

  if (!patient || !passwordMatches) {
    return { success: false, error: "Invalid email or password." };
  }

  await startSession(patient.id);
  return { success: true };
}

export async function logoutPatient(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.patientSession.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getPatientSessionByToken(token: string | undefined) {
  if (!token) return null;

  const session = await prisma.patientSession.findUnique({
    where: { token },
    include: { patient: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.patientSession.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return { patientId: session.patientId, name: session.patient.name, email: session.patient.email };
}

export async function verifyPatientSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getPatientSessionByToken(token);
}
