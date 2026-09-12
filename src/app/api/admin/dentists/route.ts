import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { validateDentist, createDentist, type NewDentistInput } from "@/lib/dentists";

export async function POST(request: Request) {
  // Same inline-check pattern as every other admin route handler — proxy.ts
  // only protects page routes, not /api/*.
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

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
    const dentist = await createDentist(body as NewDentistInput);
    return NextResponse.json({ dentist }, { status: 201 });
  } catch (error) {
    console.error("Failed to create dentist:", error);
    return NextResponse.json(
      { error: "Something went wrong saving that dentist. Please try again." },
      { status: 500 },
    );
  }
}
