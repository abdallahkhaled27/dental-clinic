import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/clinic-data";

// Blocks the staff tool entirely, the API, and every patient-account page
// in both locales — none of these have content a search result should
// ever point to (they're either gated behind a session, or pure
// transactional flows like login/register with nothing to rank on).
// Everything else — really just the homepage — stays crawlable.
export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/admin",
    "/api",
    "/book",
    "/ar/book",
    "/dashboard",
    "/ar/dashboard",
    "/login",
    "/ar/login",
    "/register",
    "/ar/register",
    "/forgot-password",
    "/ar/forgot-password",
    "/reset-password",
    "/ar/reset-password",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
