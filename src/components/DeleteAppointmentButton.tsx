"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hoursUntilAppointment } from "@/lib/appointments";
import { cancellationNoticeHours, depositAmountEgp } from "@/lib/clinic-data";

export default function DeleteAppointmentButton({
  appointmentId,
  patientName,
  date,
  time,
  depositStatus,
}: {
  appointmentId: string;
  patientName: string;
  date: string;
  time: string;
  depositStatus: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCancel() {
    // Just wording the confirm() prompt honestly — the server independently
    // decides (and enforces) the same rule when the request actually
    // arrives, using its own clock rather than trusting this client-side
    // estimate.
    const willForfeitDeposit =
      depositStatus === "paid" &&
      hoursUntilAppointment(date, time) < cancellationNoticeHours;

    const confirmed = window.confirm(
      willForfeitDeposit
        ? `Cancel ${patientName}'s appointment? This can't be undone. It's less than ${cancellationNoticeHours} hours away, so the EGP ${depositAmountEgp} deposit will NOT be refunded.`
        : `Cancel ${patientName}'s appointment? This can't be undone.${
            depositStatus === "paid" ? ` Their EGP ${depositAmountEgp} deposit will be refunded.` : ""
          }`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        alert(data?.error ?? "Something went wrong. Please try again.");
        setIsDeleting(false);
        return;
      }
      if (data?.depositForfeited) {
        alert(`Cancelled. The EGP ${depositAmountEgp} deposit was kept (late cancellation).`);
      }
      router.refresh();
    } catch {
      alert("Couldn't reach the server. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isDeleting}
      className="text-sm text-danger transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDeleting ? "Cancelling…" : "Cancel"}
    </button>
  );
}
