import { openai } from "./openai";
import { prisma } from "./prisma";

const EMBEDDING_MODEL = "text-embedding-3-small";

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

// Cosine similarity: how close two vectors point in the same direction,
// from -1 (opposite) to 1 (identical). For embeddings, closer to 1 means
// "similar meaning" — this is the standard way to compare them.
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

// Retrieves the `topK` knowledge base entries most relevant to `question`.
// With only a few dozen entries, comparing against every row in plain
// JavaScript is simple and fast enough — no vector database needed at this
// scale. A knowledge base of thousands of entries would instead push this
// comparison into the database itself (e.g. the pgvector extension).
export async function retrieveRelevantKnowledge(
  question: string,
  topK = 3,
): Promise<{ topic: string; content: string }[]> {
  const questionEmbedding = await embedText(question);
  const chunks = await prisma.knowledgeChunk.findMany();

  const scored = chunks.map((chunk) => ({
    topic: chunk.topic,
    content: chunk.content,
    score: cosineSimilarity(questionEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
