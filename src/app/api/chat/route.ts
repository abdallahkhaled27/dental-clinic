import { openai } from "@/lib/openai";
import { clinicInfo, services, hours } from "@/lib/clinic-data";
import { retrieveRelevantKnowledge } from "@/lib/rag";
import { validateAppointment, type NewAppointmentInput } from "@/lib/appointments";
import { createAppointment } from "@/lib/appointments-db";
import { validateLead, createLead, type NewLeadInput } from "@/lib/leads";
import { bookAppointmentTool, captureLeadTool } from "@/lib/tools";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

type ChatMessage = { role: "user" | "assistant"; content: string };

function buildInstructions(
  relevantKnowledge: { topic: string; content: string }[],
): string {
  const today = new Date().toISOString().split("T")[0];

  const base = `You are a friendly, concise virtual receptionist for ${clinicInfo.name}, a dental clinic. Today's date is ${today}.

Clinic info:
- Phone: ${clinicInfo.phone}
- Email: ${clinicInfo.email}
- Address: ${clinicInfo.address}
- Hours: ${hours.map((h) => `${h.day}: ${h.time}`).join("; ")}
- Services offered: ${services.map((s) => `${s.name} (id: ${s.id})`).join(", ")}

Answer patient questions using only the information provided to you. Never invent specific numbers — prices, costs, statistics, wait times, or anything similarly precise — that aren't explicitly given above; if asked for one you don't have, say you don't have exact pricing and suggest calling the clinic. Keep responses short (2-4 sentences) and friendly.

You CAN book appointments directly using the book_appointment tool. Before calling it, make sure you have the patient's name, email, phone, which service, a date, and a time — ask for anything missing rather than guessing. After a successful booking, confirm the details back to the patient. If booking fails, explain the problem in plain language and ask them to try again.

If a patient shows real interest but isn't ready to book right now (asking about pricing without committing, seems unsure, or their situation needs a real person), offer to have someone from the team follow up with them. Only if they agree, ask for their name and best contact info, then use the capture_lead tool. Don't push this on every message — only when it's a natural fit.`;

  if (relevantKnowledge.length === 0) return base;

  return `${base}\n\nRelevant details for this question:\n${relevantKnowledge
    .map((k) => `- ${k.topic}: ${k.content}`)
    .join("\n")}`;
}

// Runs the actual booking — the SAME validation and database write the
// manual booking form (BookingForm.tsx -> /api/appointments) uses. The AI
// doesn't get a shortcut around validation just because it's the one
// calling this instead of a human filling out a form.
async function runBookAppointment(argsJson: string): Promise<string> {
  let input: Partial<NewAppointmentInput>;
  try {
    input = JSON.parse(argsJson);
  } catch {
    return JSON.stringify({ success: false, error: "Invalid arguments." });
  }

  const validationError = validateAppointment(input);
  if (validationError) {
    return JSON.stringify({ success: false, error: validationError });
  }

  try {
    const appointment = await createAppointment(input as NewAppointmentInput);
    return JSON.stringify({
      success: true,
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
    });
  } catch (error) {
    console.error("Failed to create appointment (chat tool call):", error);
    return JSON.stringify({
      success: false,
      error: "Something went wrong saving the appointment. Ask the patient to try again shortly, or use the booking form directly.",
    });
  }
}

async function runCaptureLead(argsJson: string): Promise<string> {
  let input: Partial<NewLeadInput>;
  try {
    input = JSON.parse(argsJson);
  } catch {
    return JSON.stringify({ success: false, error: "Invalid arguments." });
  }

  const validationError = validateLead(input);
  if (validationError) {
    return JSON.stringify({ success: false, error: validationError });
  }

  try {
    const lead = await createLead(input as NewLeadInput);
    return JSON.stringify({ success: true, id: lead.id });
  } catch (error) {
    console.error("Failed to create lead (chat tool call):", error);
    return JSON.stringify({
      success: false,
      error: "Something went wrong noting that down. Ask the patient to try again shortly.",
    });
  }
}

export async function POST(request: Request) {
  // 15 messages per minute per IP — generous for a real conversation, but
  // stops someone from scripting repeated requests to burn through the
  // OpenAI budget.
  if (isRateLimited(`chat:${getClientKey(request)}`, 15, 60_000)) {
    return new Response("Too many messages. Please wait a moment and try again.", {
      status: 429,
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      "Chat isn't configured yet — add OPENAI_API_KEY to your .env file.",
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const messages: ChatMessage[] | undefined = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages is required", { status: 400 });
  }

  const latestQuestion = messages[messages.length - 1]?.content ?? "";
  const relevantKnowledge = await retrieveRelevantKnowledge(latestQuestion);
  const instructions = buildInstructions(relevantKnowledge);

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let nextInput: ChatMessage[] | { type: "function_call_output"; call_id: string; output: string }[] =
          messages;
        let previousResponseId: string | undefined;

        // Bounded loop: usually one tool call, then one follow-up turn to
        // report the result to the patient. The cap just prevents a
        // runaway loop if the model kept calling tools indefinitely.
        for (let turn = 0; turn < 4; turn++) {
          const stream = await openai.responses.create({
            model: "gpt-4o-mini",
            instructions,
            tools: [bookAppointmentTool, captureLeadTool],
            input: nextInput,
            previous_response_id: previousResponseId,
            stream: true,
          });

          const toolCalls: Record<
            number,
            { name: string; call_id: string; arguments: string }
          > = {};
          let responseId: string | undefined;

          for await (const event of stream) {
            if (event.type === "response.created") {
              responseId = event.response.id;
            } else if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta));
            } else if (
              event.type === "response.output_item.added" &&
              event.item.type === "function_call"
            ) {
              toolCalls[event.output_index] = {
                name: event.item.name,
                call_id: event.item.call_id,
                arguments: "",
              };
            } else if (event.type === "response.function_call_arguments.delta") {
              toolCalls[event.output_index].arguments += event.delta;
            }
          }

          const pendingCalls = Object.values(toolCalls);
          if (pendingCalls.length === 0) {
            break; // plain text answer, no tool use — done
          }

          nextInput = await Promise.all(
            pendingCalls.map(async (call) => ({
              type: "function_call_output" as const,
              call_id: call.call_id,
              output: await (async () => {
                if (call.name === "book_appointment") {
                  return runBookAppointment(call.arguments);
                }
                if (call.name === "capture_lead") {
                  return runCaptureLead(call.arguments);
                }
                return JSON.stringify({ success: false, error: "Unknown tool." });
              })(),
            })),
          );
          previousResponseId = responseId;
        }

        controller.close();
      } catch (error) {
        console.error("Chat request failed:", error);
        controller.error(error);
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
