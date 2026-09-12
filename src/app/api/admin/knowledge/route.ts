import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { validateKnowledgeEntry, type KnowledgeEntry } from "@/lib/knowledge";
import { createKnowledgeChunk } from "@/lib/knowledge-db";

export async function POST(request: Request) {
  // Same inline-check pattern as every other admin route handler — proxy.ts
  // only protects page routes, not /api/*.
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: Partial<KnowledgeEntry>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validationError = validateKnowledgeEntry(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const chunk = await createKnowledgeChunk(body as KnowledgeEntry);
    return NextResponse.json({ chunk }, { status: 201 });
  } catch (error) {
    console.error("Failed to create knowledge base entry:", error);
    return NextResponse.json(
      { error: "Something went wrong saving that entry. Please try again." },
      { status: 500 },
    );
  }
}
