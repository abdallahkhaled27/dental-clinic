import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  validateDentist,
  updateDentist,
  deleteDentist,
  isDentistInUseError,
  type NewDentistInput,
} from "@/lib/dentists";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  let body: Partial<NewDentistInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validateDentist(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const dentist = await updateDentist(id, body as NewDentistInput);
    return NextResponse.json({ dentist });
  } catch (error) {
    console.error("Failed to update dentist:", error);
    return NextResponse.json(
      { error: "Something went wrong saving those changes. Please try again." },
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
    await deleteDentist(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isDentistInUseError(error)) {
      return NextResponse.json(
        {
          error:
            "This dentist has existing appointments and can't be deleted. Reassign or cancel those appointments first.",
        },
        { status: 409 },
      );
    }
    console.error("Failed to delete dentist:", error);
    return NextResponse.json(
      { error: "Something went wrong deleting that dentist. Please try again." },
      { status: 500 },
    );
  }
}
