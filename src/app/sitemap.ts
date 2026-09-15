import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/clinic-data";

// Deliberately just the homepage, in each locale — the only page here
// that's both public and actually content-rich. /book, /dashboard,
// /login, /register, and friends are excluded the same way they're
// excluded from robots.ts: no unique indexable content, or gated behind
// a session a crawler will never have.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: {
          en: siteUrl,
          ar: `${siteUrl}/ar`,
        },
      },
    },
  ];
}
