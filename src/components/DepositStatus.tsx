"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import PayDepositButton from "@/components/PayDepositButton";
import Spinner from "@/components/ui/Spinner";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 10; // ~20 seconds of polling before giving up

// Renders the Deposit badge + retry button for one appointment on the
// patient dashboard — split out from the list itself only because it needs
// to poll (via router.refresh(), which re-runs the server component tree
// and passes fresh props back down) right after a Stripe redirect.
//
// Without this, a patient landing back on /dashboard?deposit=success saw
// the "we're confirming it now" banner right next to a still-visible "Pay
// deposit" button — true in the literal sense (the webhook genuinely
// hasn't landed yet), but confusing enough that a patient who'd already
// paid clicked it again and created a second, separate Checkout session
// for the same appointment. `justPaid` (true only for the most recently
// created still-pending appointment, and only when the URL says
// deposit=success — see the dashboard page) makes this component show a
// "confirming" state and poll briefly instead, falling back to the normal
// pending/pay-again state if the webhook still hasn't landed after ~20s.
export default function DepositStatus({
  appointmentId,
  depositStatus,
  justPaid,
}: {
  appointmentId: string;
  depositStatus: string;
  justPaid: boolean;
}) {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const [pollsLeft, setPollsLeft] = useState(justPaid && depositStatus !== "paid" ? MAX_POLLS : 0);

  useEffect(() => {
    if (depositStatus === "paid" || pollsLeft <= 0) return;
    const timer = setTimeout(() => {
      setPollsLeft((n) => n - 1);
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [pollsLeft, depositStatus, router]);

  if (depositStatus === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
        {t("depositPaid")}
      </span>
    );
  }

  if (pollsLeft > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <Spinner className="h-3 w-3" />
        {t("depositConfirming")}
      </span>
    );
  }

  return (
    <>
      <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
        {t("depositPending")}
      </span>
      <PayDepositButton appointmentId={appointmentId} />
    </>
  );
}
