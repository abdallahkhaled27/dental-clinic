import { NextResponse } from "next/server";
import { registerPatient } from "@/lib/patient-auth";
import { isValidEmail, isValidPassword } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 5 sign-ups per minute per IP — a real patient registers once, not in bulk.
  if (isRateLimited(`patient-register:${getClientKey(request)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const result = await registerPatient(name, email, password);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
