"use client";

import { useState } from "react";
import Link from "next/link";
import PatientNavLink from "./PatientNavLink";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-surface px-6 py-4 shadow-lg">
          <nav className="flex flex-col gap-4 text-sm">
            <Link href="/#services" onClick={() => setIsOpen(false)} className="text-foreground/80 hover:text-foreground">
              Services
            </Link>
            <Link href="/#about" onClick={() => setIsOpen(false)} className="text-foreground/80 hover:text-foreground">
              About
            </Link>
            <Link href="/#contact" onClick={() => setIsOpen(false)} className="text-foreground/80 hover:text-foreground">
              Contact
            </Link>
            <div className="border-t border-border pt-4">
              <PatientNavLink />
            </div>
            <Link
              href="/book"
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Book Appointment
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
