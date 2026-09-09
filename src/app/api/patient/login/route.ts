import { NextResponse } from "next/server";
import { attemptPatientLogin } from "@/lib/patient-auth";
import { isValidEmail } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 5 attempts per minute per IP — see the identical check on the staff
  // login route for why.
  if (isRateLimited(`patient-login:${getClientKey(request)}`, 5, 60_000)) {
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

  const result = await attemptPatientLogin(email, password);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json({ success: true });
}
