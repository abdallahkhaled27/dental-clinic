import { clinicInfo, siteUrl } from "@/lib/clinic-data";

// schema.org JSON-LD, the format Google actually reads to show rich
// results (opening hours, phone, map card) instead of a plain blue link —
// "Dentist" is schema.org's own subtype of LocalBusiness, built exactly
// for this. Facts only (phone, address, hours) — nothing here needs
// translating per locale, so this renders identically on both.
export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: clinicInfo.name,
    url: siteUrl,
    telephone: clinicInfo.phone,
    email: clinicInfo.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address,
      addressCountry: "EG",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
  };

  return (
    // Fully controlled, static data — never user input — so a plain
    // JSON.stringify into dangerouslySetInnerHTML is safe here.
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
