import type { Dentist } from "@prisma/client";
import { services } from "./clinic-data";
import { timeSlots } from "./appointments";

// A "tool" is a function description the model can choose to call instead
// of (or in addition to) replying with text. The JSON schema in `parameters`
// isn't just documentation — with `strict: true`, OpenAI actually validates
// the model's arguments against it before we ever see them, which is why
// serviceId, dentistId, and time use `enum` here instead of a free-text
// description.
//
// Unlike `services` and `timeSlots` (static, known at import time), dentists
// live in the database, so this tool's schema can't be a plain constant —
// it has to be built per-request with whichever dentists currently exist.
export function buildBookAppointmentTool(dentists: Dentist[]) {
  return {
    type: "function" as const,
    name: "book_appointment",
    description:
      "Book a dental appointment for the patient. Only call this once you have all required details confirmed with the patient: name, email, phone, which service, which dentist, a date, and a time.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Patient's full name." },
        email: { type: "string", description: "Patient's email address." },
        phone: { type: "string", description: "Patient's phone number." },
        serviceId: {
          type: "string",
          enum: services.map((service) => service.id),
          description: "Which service to book.",
        },
        dentistId: {
          type: "string",
          enum: dentists.map((dentist) => dentist.id),
          description: "Which dentist to book with.",
        },
        date: {
          type: "string",
          description: "Appointment date in YYYY-MM-DD format. Must not be in the past.",
        },
        time: {
          type: "string",
          enum: timeSlots,
          description: "Appointment time slot.",
        },
        notes: {
          type: ["string", "null"],
          description: "Any additional notes from the patient, or null if none.",
        },
      },
      required: ["name", "email", "phone", "serviceId", "dentistId", "date", "time", "notes"],
      additionalProperties: false,
    },
    strict: true,
  };
}

export const captureLeadTool = {
  type: "function" as const,
  name: "capture_lead",
  description:
    "Save a potential patient's contact info so clinic staff can follow up personally. Use this when someone shows interest but isn't ready to book right now, or explicitly asks to be contacted — always ask permission before calling this.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Patient's full name." },
      contact: {
        type: "string",
        description: "Best way to reach them — a phone number or email address.",
      },
      interest: {
        type: "string",
        description:
          "Brief note on what they're interested in, e.g. 'Invisalign pricing' or 'nervous about first visit'.",
      },
    },
    required: ["name", "contact", "interest"],
    additionalProperties: false,
  },
  strict: true,
};
