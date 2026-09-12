import { prisma } from "../src/lib/prisma";
import { embedText } from "../src/lib/rag";
import { knowledgeBase } from "../src/lib/knowledge";

async function main() {
  console.log(`Seeding ${knowledgeBase.length} knowledge base entries...`);

  // Wipe existing entries so re-running this script doesn't create
  // duplicates — fine for a fresh/dev database, but this is now
  // DESTRUCTIVE against a live one: staff can edit the knowledge base
  // directly from /admin (see knowledge-db.ts), and this wipes any of
  // those edits back to whatever's hardcoded in knowledge.ts. Only run
  // this against a database staff haven't started editing yet.
  await prisma.knowledgeChunk.deleteMany();

  for (const entry of knowledgeBase) {
    const embedding = await embedText(entry.content);
    await prisma.knowledgeChunk.create({
      data: {
        topic: entry.topic,
        content: entry.content,
        embedding,
      },
    });
    console.log(`  embedded: ${entry.topic}`);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
