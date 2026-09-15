import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { markDepositPaid } from "@/lib/payments";

// The only place depositStatus ever becomes "paid" — never the client-side
// redirect back from Checkout (success_url), which just means the browser
// got redirected, not that Stripe actually confirmed the charge. Stripe
// calls this directly, server-to-server, once the payment is real.
//
// Signature verification (constructEventAsync against STRIPE_WEBHOOK_SECRET)
// is what stops this from being a wide-open "mark any appointment paid"
// endpoint — without it, anyone who found the URL could POST a fake
// checkout.session.completed event with an arbitrary appointmentId.
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    console.error("Stripe webhook called but STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET isn't configured.");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // The raw body, not a parsed one — Stripe's signature is computed over
  // the exact bytes it sent, so re-serializing a parsed JSON object would
  // almost never match and every webhook would fail verification.
  const rawBody = await request.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const appointmentId = event.data.object.metadata?.appointmentId;
    if (appointmentId) {
      await markDepositPaid(appointmentId);
    } else {
      console.error("checkout.session.completed with no appointmentId in metadata:", event.data.object.id);
    }
  }

  return NextResponse.json({ received: true });
}
