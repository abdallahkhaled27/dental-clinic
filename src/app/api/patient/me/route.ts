import { NextResponse } from "next/server";
import { verifyPatientSession } from "@/lib/patient-auth";

// Deliberately tiny: just enough for the header to know whether to show
// "Patient Login" or the signed-in state, without making every page on
// the site dynamic (see PatientNavLink.tsx for why this is a client-side
// fetch instead of a server-side session check in the layout).
export async function GET() {
  const session = await verifyPatientSession();
  return NextResponse.json({ name: session?.name ?? null });
}
