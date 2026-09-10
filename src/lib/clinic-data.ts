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
// with `hours` by hand: 0 = Sunday, ..., 6 = Saturday (JS Date#getDay()).
export const closedWeekdays = [5, 6]; // Friday, Saturday
