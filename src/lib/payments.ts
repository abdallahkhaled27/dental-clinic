import "server-only";
import type { Appointment } from "@prisma/client";
import { getStripe } from "./stripe";
import { prisma } from "./prisma";
import { depositAmountEgp, clinicInfo } from "./clinic-data";

export const depositStatuses = ["pending", "paid", "refunded"] as const;
export type DepositStatus = (typeof depositStatuses)[number];

// Shared by the manual booking route, the "pay deposit" retry endpoint,
// and the chatbot's book_appointment tool — every way an appointment can
// get created (or need a fresh payment link) goes through the exact same
// Stripe session shape, the same way validateAppointment is shared for
// booking rules instead of re-implemented per entry point.
//
// Returns null when Stripe isn't configured — every caller treats that
// as "skip the deposit step" (matching the app's existing pattern: a
// missing RESEND_API_KEY skips a confirmation email, not the booking
// itself). A booking is never blocked on payment infrastructure being
// unavailable, especially since payment can always be settled at the
// clinic in person.
export async function createDepositCheckoutSession(
  appointment: Appointment,
  origin: string,
  locale: string,
): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  // Reuse a still-open session instead of creating a second one — every
  // caller here (initial booking, the dashboard's retry button, a
  // reminder email) can run while an earlier session for this same
  // appointment is still payable, and Checkout sessions stay open for up
  // to 24h. Without this, a patient who paid on session A but clicked
  // "Pay deposit" again before the webhook had marked it paid (session A
  // succeeding doesn't retroactively close out session B) could end up
  // completing payment on session B too — there's nothing here or on
  // Stripe's side that would catch or refund a second real charge for one
  // deposit. Reusing the same session whenever possible is what actually
  // closes that gap, not just hiding the retry button in the UI for a
  // while (see DepositStatus.tsx, which only covers the first ~20s).
  if (appointment.stripeSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(appointment.stripeSessionId);
      if (existing.status === "open" && existing.url) {
        return existing.url;
      }
    } catch {
      // Not retrievable (bad/stale id) — fall through and create a fresh one.
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    // Stripe's own hosted page can render in Arabic too — matches the
    // language the rest of the booking flow was already in, rather than
    // switching an Arabic patient to an English payment page mid-flow.
    locale: locale === "ar" ? "ar" : "en",
    line_items: [
      {
        price_data: {
          currency: "egp",
          unit_amount: depositAmountEgp * 100,
          product_data: {
            name: `Booking deposit — ${clinicInfo.name}`,
            description: `Appointment on ${appointment.date} at ${appointment.time}`,
          },
        },
        quantity: 1,
      },
    ],
    // metadata (not just relying on the success redirect) is what the
    // webhook actually uses to know which appointment to mark paid — a
    // patient can close the tab before ever reaching success_url, so
    // that redirect is a UX nicety, never the source of truth.
    metadata: { appointmentId: appointment.id },
    success_url: `${origin}/dashboard?deposit=success`,
    cancel_url: `${origin}/dashboard?deposit=canceled`,
  });

  // Recorded even though it's re-derivable from Stripe's own dashboard —
  // depositAmount specifically survives a future change to
  // depositAmountEgp without rewriting what this particular appointment
  // was actually charged.
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { stripeSessionId: session.id, depositAmount: depositAmountEgp * 100 },
  });

  return session.url;
}

// Called only from the webhook handler — this is the one place
// depositStatus ever becomes "paid" (see the model comment in
// schema.prisma for why the client-side redirect alone can't be trusted
// for this).
export async function markDepositPaid(appointmentId: string): Promise<void> {
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { depositStatus: "paid" },
  });
}

// Called from the admin cancel-appointment route before the appointment
// row is deleted — a paid deposit must never just vanish along with the
// booking. Throws (rather than swallowing the error) so the caller can
// stop the cancellation instead of deleting a row whose deposit was
// never actually returned to the patient.
//
// The DB is updated to "refunded" as soon as Stripe confirms the refund,
// separately from the row deletion that follows — if that deletion then
// fails for some unrelated reason, the appointment survives with
// depositStatus already "refunded", so a retry (or a human reading the
// admin table) doesn't see it as still owing a refund.
export async function refundDeposit(appointment: Appointment): Promise<void> {
  if (appointment.depositStatus !== "paid") return;

  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe isn't configured — can't refund this deposit automatically.");
  }
  if (!appointment.stripeSessionId) {
    throw new Error("This appointment is marked paid but has no Stripe session on record.");
  }

  const session = await stripe.checkout.sessions.retrieve(appointment.stripeSessionId);
  if (!session.payment_intent) {
    throw new Error("The Stripe session for this appointment has no payment to refund.");
  }

  await stripe.refunds.create({
    payment_intent:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id,
  });

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { depositStatus: "refunded" },
  });
}
