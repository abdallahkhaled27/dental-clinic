import type { KnowledgeChunk } from "@prisma/client";
import { prisma } from "./prisma";
import { embedText } from "./rag";
import type { KnowledgeEntry } from "./knowledge";

// Server-only: writes to Postgres via Prisma (and calls OpenAI to compute
// embeddings) — never import this from a Client Component. This is the
// live knowledge base staff manage from /admin; see the note atop
// knowledge.ts for how this relates to the seed script's static list.

export function getKnowledgeChunks(): Promise<KnowledgeChunk[]> {
  return prisma.knowledgeChunk.findMany({ orderBy: { topic: "asc" } });
}

export function getKnowledgeChunkById(id: string): Promise<KnowledgeChunk | null> {
  return prisma.knowledgeChunk.findUnique({ where: { id } });
}

// Re-embeds `content` on every create/update — the embedding is a
// representation of the content's meaning, so it goes stale the moment the
// text it was computed from changes. There's no way to patch an embedding
// incrementally; the only correct move is recomputing it from scratch.
export async function createKnowledgeChunk(input: KnowledgeEntry): Promise<KnowledgeChunk> {
  const embedding = await embedText(input.content);
  return prisma.knowledgeChunk.create({
    data: { topic: input.topic.trim(), content: input.content.trim(), embedding },
  });
}

export async function updateKnowledgeChunk(
  id: string,
  input: KnowledgeEntry,
): Promise<KnowledgeChunk> {
  const embedding = await embedText(input.content);
  return prisma.knowledgeChunk.update({
    where: { id },
    data: { topic: input.topic.trim(), content: input.content.trim(), embedding },
  });
}

export function deleteKnowledgeChunk(id: string): Promise<KnowledgeChunk> {
  return prisma.knowledgeChunk.delete({ where: { id } });
}
