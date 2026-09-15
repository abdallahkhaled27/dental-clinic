import OpenAI from "openai";

// Built lazily on first use, not at module scope — same reasoning as
// getResendClient() in email.ts: the OpenAI constructor throws
// synchronously when no API key is configured, and Next.js evaluates
// route modules (importing this file along the way) while collecting
// page data at *build* time. A top-level `new OpenAI()` here fails the
// entire production build the moment OPENAI_API_KEY is unset — confirmed
// by actually running a build without it — instead of just failing the
// chat feature at request time the way the explicit
// `OPENAI_API_KEY` checks in /api/chat's route handler are meant to.
let client: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI();
  }
  return client;
}
