import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/patient-auth";
import { isValidEmail } from "@/lib/validation";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // 5 requests per minute per IP — see the identical check on the login
  // routes for why. Also stops this from being usable to mass-email
  // patients by hammering the endpoint.
  if (isRateLimited(`forgot-password:${getClientKey(request)}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  await requestPasswordReset(email, new URL(request.url).origin);

  // Same response whether or not an account exists — see
  // requestPasswordReset's own comment for why that matters.
  return NextResponse.json({ success: true });
}
