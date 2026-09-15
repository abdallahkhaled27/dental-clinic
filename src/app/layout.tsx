import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Cairo has real Arabic glyph coverage (Geist doesn't) — named for the
// clinic's own city, which made it an easy pick once Arabic support was
// on the table. Loaded unconditionally alongside Geist rather than only
// on Arabic pages: swapping which one's `font-family` applies is a CSS
// concern (see the `html[dir="rtl"] body` rule in globals.css), not a
// loading concern.
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "Bright Smile Dental",
  description: "Modern dental care for the whole family.",
};

// Deliberately bare: fonts and the CSS reset are the only things every
// route needs. The public site's chrome (Header/Footer/ChatWidget) lives
// in [locale]/(site)/layout.tsx instead of here, and /admin gets its own
// minimal shell in admin/layout.tsx — an internal staff tool showing the
// "Book Appointment" marketing CTA and the patient chat widget doesn't
// make sense, and putting Header/Footer here made that unavoidable.
//
// This is the one layout shared by both the localized (site) tree and the
// English-only /admin tree, so it can't read a [locale] route param
// directly — instead it reads the "x-locale" header proxy.ts sets on
// every request (computed from the URL there, the same place that
// already decides /ar routing), and picks `lang`/`dir` from that. Falls
// back to "en"/"ltr" for /admin and /api, where the header is never set.
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = (await headers()).get("x-locale") ?? "en";
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
