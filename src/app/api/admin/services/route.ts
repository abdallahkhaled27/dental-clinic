import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { validateServiceInput, createService, type NewServiceInput } from "@/lib/services";

export async function POST(request: Request) {
  // Same inline-check pattern as every other admin route handler — proxy.ts
  // only protects page routes, not /api/*.
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

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
    const service = await createService(body as NewServiceInput);
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: "Something went wrong saving that service. Please try again." },
      { status: 500 },
    );
  }
}
