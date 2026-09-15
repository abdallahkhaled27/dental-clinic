"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

// The root layout (and therefore Header) renders on every page, including
// the static homepage — checking the session there would force the whole
// site to render dynamically per-request just to label one nav link. This
// component isolates that cost: it renders the generic "Login" link
// immediately (so there's no layout shift or blank state), then fetches
// the real session client-side and swaps the label in if needed.
export default function PatientNavLink() {
  const [name, setName] = useState<string | null>(null);
  const t = useTranslations("Nav");
  // Header lives in a layout that persists across client-side navigations
  // (that's the whole point of Next.js layouts — it doesn't remount on
  // every page change), so a plain mount-only effect would check the
  // session exactly once and then never again: log in and this link would
  // keep saying "Login" until a full page reload. Re-running the check
  // whenever the path changes (e.g. the redirect after a successful
  // login) keeps it in sync with reality instead.
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/patient/me")
      .then((res) => res.json())
      .then((data) => setName(data.name))
      .catch(() => {});
  }, [pathname]);

  if (name) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-foreground/80 transition-colors hover:text-foreground"
        >
          {t("myAppointments")}
        </Link>
        <form action="/api/patient/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-foreground/80 transition-colors hover:text-foreground"
          >
            {t("logout")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm text-foreground/80 transition-colors hover:text-foreground"
    >
      {t("login")}
    </Link>
  );
}
