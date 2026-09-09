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
      <Link href="/patient/dashboard" className="hidden text-sm hover:opacity-70 sm:inline">
        My Appointments
      </Link>
    );
  }

  return (
    <Link href="/patient/login" className="hidden text-sm hover:opacity-70 sm:inline">
      Patient Login
    </Link>
  );
}
