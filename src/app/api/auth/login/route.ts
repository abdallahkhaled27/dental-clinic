import { NextResponse } from "next/server";
import { attemptLogin } from "@/lib/auth";
import { isValidEmail } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 5 attempts per minute per IP — brute-forcing a password needs far more
  // guesses than that, so this doesn't slow down a real person mistyping
  // their password, but makes guessing genuinely impractical.
  if (isRateLimited(`login:${getClientKey(request)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "A valid email and password are required." },
      { status: 400 },
    );
  }

  const result = await attemptLogin(email, password);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
