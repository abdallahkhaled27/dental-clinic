"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

// Shown next to any appointment still depositStatus "pending" — reuses
// the same /api/stripe/checkout endpoint the initial booking flow's
// inline session creation does (see payments.ts), for the case where a
// patient closed the tab, let a session expire, or hit "cancel" on
// Stripe's page the first time and wants another link.
export default function PayDepositButton({ appointmentId }: { appointmentId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  async function handleClick() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, locale }),
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error ?? t("depositError"));
        setIsLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError(t("depositError"));
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? t("depositRedirecting") : t("payDeposit")}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
