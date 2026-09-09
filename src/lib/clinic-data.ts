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
  phone: "(555) 123-4567",
  email: "hello@brightsmiledental.com",
  address: "123 Main Street, Springfield, ST 12345",
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
  { day: "Monday – Friday", time: "8:00 AM – 6:00 PM" },
  { day: "Saturday", time: "9:00 AM – 2:00 PM" },
  { day: "Sunday", time: "Closed" },
];
