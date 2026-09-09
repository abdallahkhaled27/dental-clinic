import "server-only";
import { Resend } from "resend";
import { clinicInfo } from "./clinic-data";

// Built lazily, inside each function below, instead of once at module
// scope: the Resend constructor throws synchronously when no key is
// passed, and Next.js evaluates route modules (importing this file along
// the way) while collecting page data at *build* time — so a top-level
// `new Resend(...)` here would fail the entire production build the
// moment RESEND_API_KEY is unset, not just skip sending an email at
// request time the way the `if (!process.env.RESEND_API_KEY)` checks
// below are meant to.
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// Resend's shared sandbox address — works with zero setup, but (like any
// sender on a domain you haven't verified) can only actually deliver to
// the email address the Resend account itself was signed up with. Sending
// to real patients needs a verified domain (Resend -> Domains), after
// which this becomes e.g. "Bright Smile Dental <appointments@brightsmiledental.com>".
const FROM = "Bright Smile Dental <onboarding@resend.dev>";

// Both functions below deliberately never throw — a booking or a lead is
// already saved in the database by the time either of these runs, so a
// failed confirmation email (bad address, Resend outage, sandbox
// restriction) shouldn't turn a successful booking into an error response.
// It's a best-effort notification, not part of the booking's own
// correctness.

export async function sendAppointmentConfirmationEmail(params: {
  to: string;
  patientName: string;
  serviceName: string;
  dentistName: string;
  date: string;
  time: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping appointment confirmation email.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Appointment confirmed — ${params.date} at ${params.time}`,
      html: `
        <p>Hi ${params.patientName},</p>
        <p>Your appointment at ${clinicInfo.name} is confirmed:</p>
        <ul>
          <li><strong>Service:</strong> ${params.serviceName}</li>
          <li><strong>Dentist:</strong> ${params.dentistName}</li>
          <li><strong>Date:</strong> ${params.date}</li>
          <li><strong>Time:</strong> ${params.time}</li>
        </ul>
        <p>Need to reschedule or have a question? Call us at ${clinicInfo.phone}.</p>
        <p>— ${clinicInfo.name}</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send appointment confirmation email:", error);
  }
}

export async function sendLeadConfirmationEmail(params: {
  to: string;
  name: string;
  interest: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping lead confirmation email.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `We received your request — ${clinicInfo.name}`,
      html: `
        <p>Hi ${params.name},</p>
        <p>Thanks for reaching out to ${clinicInfo.name} about "${params.interest}". Someone from our team will get in touch with you soon.</p>
        <p>If it's urgent, call us directly at ${clinicInfo.phone}.</p>
        <p>— ${clinicInfo.name}</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send lead confirmation email:", error);
  }
}
