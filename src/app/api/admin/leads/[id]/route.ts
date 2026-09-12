import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { isValidLeadStatus } from "@/lib/leads";
import { updateLeadStatus, deleteLead } from "@/lib/leads-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Same inline-check pattern as every other admin route handler — proxy.ts
  // only protects page routes, not /api/*.
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidLeadStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    const lead = await updateLeadStatus(id, body.status);
    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Failed to update lead status:", error);
    return NextResponse.json(
      { error: "Something went wrong saving that change. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteLead(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json(
      { error: "Something went wrong deleting that lead. Please try again." },
      { status: 500 },
    );
  }
}
