import Link from "next/link";
import { clinicInfo } from "@/lib/clinic-data";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold">
          {clinicInfo.name}
        </Link>

        <nav className="hidden gap-6 text-sm sm:flex">
          <Link href="/#services" className="hover:opacity-70">
            Services
          </Link>
          <Link href="/#about" className="hover:opacity-70">
            About
          </Link>
          <Link href="/#contact" className="hover:opacity-70">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/patient/login" className="hidden text-sm hover:opacity-70 sm:inline">
            Patient Login
          </Link>
          <Link
            href="/book"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </header>
  );
}
