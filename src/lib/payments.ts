import "server-only";
import type { Appointment } from "@prisma/client";
import { getStripe } from "./stripe";
import { prisma } from "./prisma";
import { depositAmountEgp, clinicInfo } from "./clinic-data";

export const depositStatuses = ["pending", "paid"] as const;
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
