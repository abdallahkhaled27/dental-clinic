// Static content for the clinic website.
// This is a stand-in for real data until Feature 3 (Database integration),
// when this will move into the database and be fetched via queries instead.

export type Service = {
  id: string;
  name: string;
  description: string;
};

export const clinicInfo = {
  name: "Bright Smile Dental",
  tagline: "Modern dental care for the whole family",
  phone: "+20 155 555 2764",
  email: "abdallah.khaled2003@gmail.com",
  address: "Rehab City, New Cairo",
  // Digits only, country code first, no "+" or spaces — the format
  // wa.me links require.
  whatsapp: "201555552764",
};

export const services: Service[] = [
  {
    id: "checkup",
    name: "Routine Checkups & Cleaning",
    description:
      "Comprehensive exams and professional cleaning to keep your smile healthy.",
  },
  {
    id: "whitening",
    name: "Teeth Whitening",
    description:
      "Safe, effective whitening treatments for a brighter, more confident smile.",
  },
  {
    id: "orthodontics",
    name: "Orthodontics",
    description:
      "Braces and clear aligners for patients of all ages.",
  },
  {
    id: "emergency",
    name: "Emergency Care",
    description:
      "Same-day appointments for dental pain, injuries, and urgent issues.",
  },
  {
    id: "cosmetic",
    name: "Cosmetic Dentistry",
    description:
      "Veneers, bonding, and smile makeovers tailored to your goals.",
  },
  {
    id: "pediatric",
    name: "Pediatric Dentistry",
    description:
      "Gentle, kid-friendly care to build healthy habits early.",
  },
];

export const hours: { day: string; time: string }[] = [
  { day: "Sunday – Thursday", time: "9:00 AM – 5:00 PM" },
  { day: "Friday", time: "Closed" },
  { day: "Saturday", time: "Closed" },
];

// The structured half of `hours` above — used by validateAppointment to
// actually reject bookings on a closed day, not just display text a
// patient (or the AI) could still book straight through. Kept in sync
// with `hours` by hand: 0 = Sunday, ..., 6 = Saturday (JS Date#getUTCDay()).
export const closedWeekdays = [5, 6]; // Friday, Saturday

// "Today", anchored to the clinic's own timezone — not the visitor's
// device, and not the server's. A patient's browser (or Vercel's own
// server clock) can be in any timezone; `new Date().toISOString()` gives
// UTC, which drifts a day off from Cairo's actual calendar date for
// several hours around midnight UTC (Cairo is UTC+2/+3). Since this is a
// real clinic in one real place, every visitor should see the same
// "today" — the clinic's — regardless of where they're browsing from.
// "en-CA" is a locale quirk: it's the one built-in Intl locale that
// formats as YYYY-MM-DD, matching the date strings used everywhere else
// in this app.
export function getClinicToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
}

// Tomorrow, by the same clinic-timezone rule as getClinicToday — used by
// the reminders cron job to find "appointments happening tomorrow" without
// drifting a day off near midnight UTC. Anchored at noon UTC before adding
// a day so the add can never cross a calendar boundary in the wrong
// direction (see validateAppointmentDate in appointments.ts for the same
// noon-anchor trick).
export function getClinicTomorrow(): string {
  const anchored = new Date(`${getClinicToday()}T12:00:00Z`);
  anchored.setUTCDate(anchored.getUTCDate() + 1);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(anchored);
}

// The current time of day in the clinic's timezone, as minutes since
// midnight — used to reject booking a same-day slot that's already
// passed (see timeSlotToMinutes/validateAppointmentDate in
// appointments.ts). Same Intl + explicit "Africa/Cairo" pattern as
// getClinicToday: correct regardless of the browser's or server's own
// clock timezone, since only the *instant* (new Date()) needs to be
// accurate, not the environment's zone.
export function getClinicNowMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}
