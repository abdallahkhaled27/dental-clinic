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

// A reset link is only useful for a short window — long enough for someone
// to find the email and click it, short enough that an old, forgotten link
// sitting in an inbox isn't a standing way into the account.
const PASSWORD_RESET_DURATION_MS = 1000 * 60 * 60; // 1 hour

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

async function startSession(patientId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.patientSession.create({ data: { token, patientId, expiresAt } });

  const cookieStore = await cookies();
  // No `expires` here — see the identical note in auth.ts: this makes it a
  // session cookie, gone when the browser fully closes. expiresAt is still
  // enforced server-side in getPatientSessionByToken as a backstop.
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
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

// Used by the Google sign-in callback (see auth.ts). Google has already
// verified the email belongs to whoever is signing in — that's the whole
// point of using it as an identity provider — so unlike attemptPatientLogin
// there's no password to check here. Matches an existing account by email
// (so someone who registered with a password can also just use Google
// afterward and land on the same account) or creates a new, password-less
// one.
export async function findOrCreatePatientFromGoogle(
  email: string,
  name: string,
): Promise<{ patientId: string }> {
  const patient = await prisma.patient.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash: null },
  });

  await startSession(patient.id);
  return { patientId: patient.id };
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

// Looks up the account and creates a reset token when there's actually a
// password to reset, but the caller (see the API route) always responds
// the same way either way — this function returning void, not a
// found/not-found result, is what keeps that decision out of the caller's
// hands. Revealing "no account with that email" (or "that account uses
// Google sign-in") lets an attacker enumerate real patient emails one
// guess at a time; a generic "check your inbox" doesn't.
export async function requestPasswordReset(email: string, origin: string): Promise<void> {
  const patient = await prisma.patient.findUnique({ where: { email } });
  // No account, or a Google-only account with no password to reset —
  // either way, nothing to send. Silently returning (rather than throwing
  // or signaling which case it was) is what avoids leaking either fact
  // back to the caller.
  if (!patient || !patient.passwordHash) return;

  const token = generateToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_DURATION_MS);
  await prisma.passwordResetToken.create({
    data: { token, patientId: patient.id, expiresAt },
  });

  // `origin` comes from the request the caller (the API route) received,
  // not an env var — that way the link is correct on localhost, the
  // Vercel preview domain, and the production custom domain alike with no
  // separate config to keep in sync across them.
  const { sendPasswordResetEmail } = await import("./email");
  const resetUrl = `${origin}/reset-password?token=${token}`;
  await sendPasswordResetEmail({ to: patient.email, name: patient.name, resetUrl });
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    if (resetToken) {
      await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
    }
    return { success: false, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hash(newPassword, 10);
  await prisma.$transaction([
    prisma.patient.update({
      where: { id: resetToken.patientId },
      data: { passwordHash },
    }),
    // One-time use — deleting it here is what stops the same link being
    // replayed after it's already worked once.
    prisma.passwordResetToken.delete({ where: { token } }),
    // Force re-login everywhere: if the reset was prompted by a
    // compromised account, whoever else is holding a live session (the
    // attacker included) gets signed out too, not just the browser doing
    // the reset.
    prisma.patientSession.deleteMany({ where: { patientId: resetToken.patientId } }),
  ]);

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
