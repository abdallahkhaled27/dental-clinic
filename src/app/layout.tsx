import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bright Smile Dental",
  description: "Modern dental care for the whole family.",
};

// Deliberately bare: fonts and the CSS reset are the only things every
// route needs. The public site's chrome (Header/Footer/ChatWidget) lives
// in (site)/layout.tsx instead of here, and /admin gets its own minimal
// shell in admin/layout.tsx — an internal staff tool showing the "Book
// Appointment" marketing CTA and the patient chat widget doesn't make
// sense, and putting Header/Footer here made that unavoidable.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
