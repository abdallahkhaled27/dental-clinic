import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateAppointment, validateAppointmentEdit, timeSlotToMinutes } from "@/lib/appointments";
import { services } from "@/lib/clinic-data";

const DENTIST_ID = "dentist-1";
const VALID_DENTIST_IDS = [DENTIST_ID];
const SERVICE_ID = services[0].id;

// Fixed at 2026-01-04T13:31:00Z, which is 2026-01-04 15:31 in Africa/Cairo
// (a Sunday; no DST in January, so Cairo is a flat UTC+2 here — chosen
// deliberately to avoid the DST ambiguity that real Cairo has in summer).
// That puts "now" between two real timeSlots entries — "3:00 PM"/"3:30 PM"
// just passed, "4:00 PM" is still ahead — which is exactly the boundary
// the same-day-past-slot bug needs to be tested against.
const NOW = "2026-01-04T13:31:00Z";
const TODAY = "2026-01-04"; // Sunday, clinic open
const PAST_DATE = "2026-01-01";
const FUTURE_OPEN_DATE = "2026-01-08"; // Thursday, clinic open
const FUTURE_CLOSED_DATE = "2026-01-09"; // Friday, clinic closed

function validInput(overrides: Record<string, string> = {}) {
  return {
    name: "Jane Patient",
    email: "jane@example.com",
    phone: "+201000000000",
    serviceId: SERVICE_ID,
    dentistId: DENTIST_ID,
    date: FUTURE_OPEN_DATE,
    time: "10:00 AM",
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("timeSlotToMinutes", () => {
  it("parses AM times", () => {
    expect(timeSlotToMinutes("9:00 AM")).toBe(540);
  });

  it("parses PM times", () => {
    expect(timeSlotToMinutes("4:30 PM")).toBe(990);
  });

  it("treats 12 PM as noon", () => {
    expect(timeSlotToMinutes("12:00 PM")).toBe(720);
  });

  it("treats 12 AM as midnight", () => {
    expect(timeSlotToMinutes("12:00 AM")).toBe(0);
  });

  it("returns NaN for unparseable input", () => {
    expect(timeSlotToMinutes("not a time")).toBeNaN();
  });
});

describe("validateAppointment", () => {
  it("accepts a fully valid booking", () => {
    expect(validateAppointment(validInput(), VALID_DENTIST_IDS)).toBeNull();
  });

  it("rejects a missing name", () => {
    expect(validateAppointment(validInput({ name: "" }), VALID_DENTIST_IDS)).toMatch(/name/i);
  });

  it("rejects an invalid email", () => {
    expect(
      validateAppointment(validInput({ email: "not-an-email" }), VALID_DENTIST_IDS),
    ).toMatch(/email/i);
  });

  it("rejects an invalid phone", () => {
    expect(validateAppointment(validInput({ phone: "abc" }), VALID_DENTIST_IDS)).toMatch(/phone/i);
  });

  it("rejects an unknown service", () => {
    expect(
      validateAppointment(validInput({ serviceId: "nonexistent" }), VALID_DENTIST_IDS),
    ).toMatch(/service/i);
  });

  it("rejects a dentist not in the valid list", () => {
    expect(
      validateAppointment(validInput({ dentistId: "someone-else" }), VALID_DENTIST_IDS),
    ).toMatch(/dentist/i);
  });

  it("rejects a time not in timeSlots", () => {
    expect(validateAppointment(validInput({ time: "5:00 PM" }), VALID_DENTIST_IDS)).toMatch(/time/i);
  });

  it("rejects a missing date", () => {
    expect(validateAppointment(validInput({ date: "" }), VALID_DENTIST_IDS)).toMatch(/date/i);
  });

  it("rejects a date in the past", () => {
    expect(validateAppointment(validInput({ date: PAST_DATE }), VALID_DENTIST_IDS)).toMatch(/past/i);
  });

  it("rejects a closed weekday (Friday)", () => {
    expect(
      validateAppointment(validInput({ date: FUTURE_CLOSED_DATE }), VALID_DENTIST_IDS),
    ).toMatch(/closed/i);
  });

  it("rejects a today's slot that has already passed", () => {
    // "now" is fixed at 3:31 PM Cairo — "3:00 PM" is 31 minutes gone.
    expect(
      validateAppointment(validInput({ date: TODAY, time: "3:00 PM" }), VALID_DENTIST_IDS),
    ).toMatch(/already passed/i);
  });

  it("rejects today's slot exactly at the current minute", () => {
    // "3:30 PM" (930 min) is <= now (931 min) — this is the regression
    // this whole suite exists for: booking "today, right now" (or a
    // moment ago) must never succeed. See the real bug report this fixed.
    expect(
      validateAppointment(validInput({ date: TODAY, time: "3:30 PM" }), VALID_DENTIST_IDS),
    ).toMatch(/already passed/i);
  });

  it("accepts today's slot that hasn't happened yet", () => {
    // "4:00 PM" (960 min) is still ahead of now (931 min).
    expect(
      validateAppointment(validInput({ date: TODAY, time: "4:00 PM" }), VALID_DENTIST_IDS),
    ).toBeNull();
  });
});

describe("validateAppointmentEdit", () => {
  it("accepts a valid reschedule", () => {
    expect(
      validateAppointmentEdit(
        { dentistId: DENTIST_ID, date: FUTURE_OPEN_DATE, time: "10:00 AM" },
        VALID_DENTIST_IDS,
      ),
    ).toBeNull();
  });

  it("rejects rescheduling into an already-passed slot today", () => {
    expect(
      validateAppointmentEdit(
        { dentistId: DENTIST_ID, date: TODAY, time: "3:00 PM" },
        VALID_DENTIST_IDS,
      ),
    ).toMatch(/already passed/i);
  });

  it("rejects rescheduling onto a closed day", () => {
    expect(
      validateAppointmentEdit(
        { dentistId: DENTIST_ID, date: FUTURE_CLOSED_DATE, time: "10:00 AM" },
        VALID_DENTIST_IDS,
      ),
    ).toMatch(/closed/i);
  });
});
