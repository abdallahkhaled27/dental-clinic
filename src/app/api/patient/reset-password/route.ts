import { NextResponse } from "next/server";
import { resetPassword } from "@/lib/patient-auth";
import { isValidPassword } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 5 attempts per minute per IP — a reset token is a 64-character random
  // hex string, but this still keeps someone from hammering guesses at it.
  if (isRateLimited(`reset-password:${getClientKey(request)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const result = await resetPassword(token, password);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
