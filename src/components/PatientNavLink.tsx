"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// The root layout (and therefore Header) renders on every page, including
// the static homepage — checking the session there would force the whole
// site to render dynamically per-request just to label one nav link. This
// component isolates that cost: it renders the generic "Patient Login"
// link immediately (so there's no layout shift or blank state), then
// fetches the real session client-side and swaps the label in if needed.
export default function PatientNavLink() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/patient/me")
      .then((res) => res.json())
      .then((data) => setName(data.name))
      .catch(() => {});
  }, []);

  if (name) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/patient/dashboard"
          className="text-sm text-foreground/80 transition-colors hover:text-foreground"
        >
          My Appointments
        </Link>
        <form action="/api/patient/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-foreground/80 transition-colors hover:text-foreground"
          >
            Log out
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href="/patient/login"
      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
    >
      Patient Login
    </Link>
  );
}
