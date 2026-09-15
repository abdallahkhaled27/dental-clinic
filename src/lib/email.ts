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

// mail.abdallahyoussef.com is verified in Resend (SPF/DKIM/DMARC all
// passing) — unlike the old onboarding@resend.dev sandbox address, this
// can deliver to any recipient, not just the Resend account's own email.
const FROM = "Bright Smile Dental <appointments@mail.abdallahyoussef.com>";

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
  // Present only when a deposit checkout link was actually created for
  // this booking (Stripe configured — see createDepositCheckoutSession).
  // The slot is reserved either way, but the email shouldn't call the
  // appointment "confirmed" while a deposit is still owed — that's what
  // separates this from a booking made when Stripe isn't configured at
  // all, which stays fully confirmed on saving.
  depositAmountEgp?: number;
  checkoutUrl?: string | null;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping appointment confirmation email.");
    return;
  }

  const depositPending = Boolean(params.checkoutUrl && params.depositAmountEgp);

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: depositPending
        ? `Action needed to confirm your appointment — ${params.date} at ${params.time}`
        : `Appointment confirmed — ${params.date} at ${params.time}`,
      html: `
        <p>Hi ${params.patientName},</p>
        <p>${
          depositPending
            ? `We've reserved this slot for you at ${clinicInfo.name}:`
            : `Your appointment at ${clinicInfo.name} is confirmed:`
        }</p>
        <ul>
          <li><strong>Service:</strong> ${params.serviceName}</li>
          <li><strong>Dentist:</strong> ${params.dentistName}</li>
          <li><strong>Date:</strong> ${params.date}</li>
          <li><strong>Time:</strong> ${params.time}</li>
        </ul>
        ${
          depositPending
            ? `<p>To confirm it, please pay the EGP ${params.depositAmountEgp} booking deposit:</p>
        <p><a href="${params.checkoutUrl}">Pay deposit and confirm appointment</a></p>
        <p>The slot is held for you, but it isn't confirmed until the deposit is received.</p>`
            : ""
        }
        <p>Need to reschedule or have a question? Call us at ${clinicInfo.phone}.</p>
        <p>— ${clinicInfo.name}</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send appointment confirmation email:", error);
  }
}

export async function sendAppointmentReminderEmail(params: {
  to: string;
  patientName: string;
  serviceName: string;
  dentistName: string;
  date: string;
  time: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping appointment reminder email.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Reminder: your appointment is tomorrow at ${params.time}`,
      html: `
        <p>Hi ${params.patientName},</p>
        <p>Just a reminder that you have an appointment at ${clinicInfo.name} tomorrow:</p>
        <ul>
          <li><strong>Service:</strong> ${params.serviceName}</li>
          <li><strong>Dentist:</strong> ${params.dentistName}</li>
          <li><strong>Date:</strong> ${params.date}</li>
          <li><strong>Time:</strong> ${params.time}</li>
        </ul>
        <p>Need to reschedule or cancel? Call us at ${clinicInfo.phone}.</p>
        <p>— ${clinicInfo.name}</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send appointment reminder email:", error);
  }
}

// Sent to the clinic itself, not a patient — see the two call sites
// (booking and the AI's book_appointment tool). Without this, staff only
// find out about a new booking by actively checking /admin; the patient
// already gets sendAppointmentConfirmationEmail, but nobody on the clinic
// side gets told anything landed.
export async function sendStaffNewAppointmentEmail(params: {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  serviceName: string;
  dentistName: string;
  date: string;
  time: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping staff new-appointment notification.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: clinicInfo.email,
      subject: `New booking: ${params.patientName} — ${params.date} at ${params.time}`,
      html: `
        <p>A new appointment was just booked:</p>
        <ul>
          <li><strong>Patient:</strong> ${params.patientName} (${params.patientEmail}, ${params.patientPhone})</li>
          <li><strong>Service:</strong> ${params.serviceName}</li>
          <li><strong>Dentist:</strong> ${params.dentistName}</li>
          <li><strong>Date:</strong> ${params.date}</li>
          <li><strong>Time:</strong> ${params.time}</li>
        </ul>
      `,
    });
  } catch (error) {
    console.error("Failed to send staff new-appointment notification:", error);
  }
}

// Sent to the clinic when the chatbot's capture_lead tool runs — same
// reasoning as sendStaffNewAppointmentEmail above, but for leads instead
// of bookings.
export async function sendStaffNewLeadEmail(params: {
  name: string;
  contact: string;
  interest: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping staff new-lead notification.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: clinicInfo.email,
      subject: `New lead: ${params.name}`,
      html: `
        <p>Someone showed interest through the chat and asked to be followed up with:</p>
        <ul>
          <li><strong>Name:</strong> ${params.name}</li>
          <li><strong>Contact:</strong> ${params.contact}</li>
          <li><strong>Interested in:</strong> ${params.interest}</li>
        </ul>
      `,
    });
  } catch (error) {
    console.error("Failed to send staff new-lead notification:", error);
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping password reset email.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Reset your password — ${clinicInfo.name}`,
      html: `
        <p>Hi ${params.name},</p>
        <p>We received a request to reset your password. Click the link below to choose a new one — it expires in 1 hour:</p>
        <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>— ${clinicInfo.name}</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
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
