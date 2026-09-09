import OpenAI from "openai";

// Shared client — same reasoning as the PrismaClient singleton in prisma.ts:
// one instance per process instead of a new one per import.
export const openai = new OpenAI();
