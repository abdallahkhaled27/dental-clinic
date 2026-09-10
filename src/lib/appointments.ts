import type { Appointment } from "@prisma/client";
import { services, closedWeekdays } from "./clinic-data";
import { isValidEmail, isValidPhone } from "./validation";

// This module holds pure, dependency-free logic (types, constants,
// validation) that's safe to import from Client Components. Anything that
// touches the database lives in appointments-db.ts instead — Client
// Components must never import that file, or Next.js will try to bundle
// the Postgres driver into browser JS and fail to build.
export type { Appointment };

export type NewAppointmentInput = {
  name: string;
  email: string;
  phone: string;
  serviceId: string;
  dentistId: string;
  date: string;
  time: string;
  notes?: string;
};

export const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

// Shared by validateAppointment and validateAppointmentEdit — the date
// itself has to pass the same two checks regardless of who's booking or
// whether it's a new booking or a reschedule: not in the past, and not on
// a day the clinic is closed (see closedWeekdays — this is what actually
// enforces the hours shown on the site and told to the chatbot, instead
// of just displaying them and hoping nobody books a Friday).
function validateAppointmentDate(date: string): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
    return "Please select a date that isn't in the past.";
  }
  if (closedWeekdays.includes(selectedDate.getDay())) {
    return "The clinic is closed that day. Please pick a date from Sunday to Thursday.";
  }
  return null;
}

export function validateAppointment(
  input: Partial<NewAppointmentInput>,
  validDentistIds: string[],
): string | null {
  if (!input.name?.trim()) return "Name is required.";
  if (!input.email?.trim() || !isValidEmail(input.email)) {
    return "A valid email is required.";
  }
  if (!input.phone?.trim() || !isValidPhone(input.phone)) {
    return "A valid phone number is required.";
  }
  if (!input.serviceId || !services.some((s) => s.id === input.serviceId)) {
    return "Please select a valid service.";
  }
  if (!input.dentistId || !validDentistIds.includes(input.dentistId)) {
    return "Please select a valid dentist.";
  }
  if (!input.time || !timeSlots.includes(input.time)) {
    return "Please select a valid time.";
  }
  if (!input.date) return "Please select a date.";

  return validateAppointmentDate(input.date);
}

export type AppointmentEditInput = {
  dentistId: string;
  date: string;
  time: string;
  notes?: string;
};

// The subset of an appointment staff can actually change from /admin (see
// the edit page) — not the full NewAppointmentInput. Name, email, phone,
// and service stay fixed: those identify who the appointment is for and
// what it's for, not scheduling details. If those are wrong, the right
// fix is cancelling and rebooking, not editing in place.
export function validateAppointmentEdit(
  input: Partial<AppointmentEditInput>,
  validDentistIds: string[],
): string | null {
  if (!input.dentistId || !validDentistIds.includes(input.dentistId)) {
    return "Please select a valid dentist.";
  }
  if (!input.time || !timeSlots.includes(input.time)) {
    return "Please select a valid time.";
  }
  if (!input.date) return "Please select a date.";

  return validateAppointmentDate(input.date);
}
