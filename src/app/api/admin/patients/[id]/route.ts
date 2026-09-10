import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { deletePatient } from "@/lib/patients";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // proxy.ts protects /admin (the page), not this API route — matches the
  // existing pattern for every other route handler in this app (see
  // /api/appointments): the auth check lives directly in the handler.
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deletePatient(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete patient:", error);
    return NextResponse.json(
      { error: "Something went wrong deleting that account. Please try again." },
      { status: 500 },
    );
  }
}
