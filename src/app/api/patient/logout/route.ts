import { NextResponse } from "next/server";
import { logoutPatient } from "@/lib/patient-auth";

export async function POST(request: Request) {
  await logoutPatient();
  return NextResponse.redirect(new URL("/", request.url));
}
