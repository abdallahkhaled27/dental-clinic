import "server-only";
import crypto from "crypto";
import { hash, compare, hashSync } from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// A precomputed hash of a fixed, unguessable string, compared against on
// every login attempt for an email that doesn't exist. Without this, a
// login with a real email takes measurably longer than one with a fake
// email (bcrypt is deliberately slow) — timing an attacker could use to
// find out which emails have accounts, before ever guessing a password.
const DUMMY_HASH = hashSync("no-such-account-timing-safety", 10);

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Runs the login check: looks up the user, verifies the password (always,
// even for an unknown email — see DUMMY_HASH above), and on success starts
// a real session (a database row + a cookie pointing at it).
export async function attemptLogin(
  email: string,
  password: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await prisma.staffUser.findUnique({ where: { email } });
  const passwordMatches = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !passwordMatches) {
    return { success: false, error: "Invalid email or password." };
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({ data: { token, userId: user.id, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { success: true };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

// The low-level check, given a raw token — used by both verifySession()
// below (reading the cookie via next/headers) and proxy.ts (reading the
// cookie via NextRequest, a different API in that context).
export async function getSessionByToken(token: string | undefined) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  return { userId: session.userId, email: session.user.email };
}

// The Data Access Layer's session check for Server Components and Route
// Handlers. We always hit the database (never just trust the cookie) —
// Next.js calls this the "secure" check, as opposed to a faster
// cookie-only "optimistic" check. Worth it here: /admin is low-traffic,
// so correctness matters more than shaving milliseconds off each request.
export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return getSessionByToken(token);
}
