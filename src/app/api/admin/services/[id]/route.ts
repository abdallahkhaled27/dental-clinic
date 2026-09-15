import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import {
  validateServiceInput,
  updateService,
  deleteService,
  isServiceInUseError,
  type NewServiceInput,
} from "@/lib/services";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

  let body: Partial<NewServiceInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validateServiceInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const service = await updateService(id, body as NewServiceInput);
    return NextResponse.json({ service });
  } catch (error) {
    console.error("Failed to update service:", error);
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
    await deleteService(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isServiceInUseError(error)) {
      return NextResponse.json(
        {
          error:
            "This service has existing appointments and can't be deleted. Reassign or cancel those appointments first.",
        },
        { status: 409 },
      );
    }
    console.error("Failed to delete service:", error);
    return NextResponse.json(
      { error: "Something went wrong deleting that service. Please try again." },
      { status: 500 },
    );
  }
}
