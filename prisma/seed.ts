import { prisma } from "../src/lib/prisma";
import { embedText } from "../src/lib/rag";
import { knowledgeBase } from "../src/lib/knowledge";

async function main() {
  console.log(`Seeding ${knowledgeBase.length} knowledge base entries...`);

  // Wipe existing entries so re-running this script doesn't create
  // duplicates — fine for a small, code-defined knowledge base like ours.
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
