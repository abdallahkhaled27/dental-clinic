import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { validateKnowledgeEntry, type KnowledgeEntry } from "@/lib/knowledge";
import { updateKnowledgeChunk, deleteKnowledgeChunk } from "@/lib/knowledge-db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;

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
    const chunk = await updateKnowledgeChunk(id, body as KnowledgeEntry);
    return NextResponse.json({ chunk });
  } catch (error) {
    console.error("Failed to update knowledge base entry:", error);
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
    await deleteKnowledgeChunk(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete knowledge base entry:", error);
    return NextResponse.json(
      { error: "Something went wrong deleting that entry. Please try again." },
      { status: 500 },
    );
  }
}
