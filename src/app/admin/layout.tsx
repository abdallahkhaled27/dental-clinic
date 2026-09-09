import Link from "next/link";

// Deliberately not the public site's Header/Footer/ChatWidget (see
// app/layout.tsx) — this is an internal tool, not a page on the marketing
// site, so it gets its own minimal bar instead of the "Book Appointment"
// CTA, marketing nav, patient account links, and chat bubble that make
// sense everywhere else but not here.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-border bg-surface px-6 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Bright Smile Dental
        </Link>
      </div>
      {children}
    </div>
  );
}
