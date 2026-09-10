"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteAppointmentButton({
  appointmentId,
  patientName,
}: {
  appointmentId: string;
  patientName: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCancel() {
    const confirmed = window.confirm(
      `Cancel ${patientName}'s appointment? This can't be undone.`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error ?? "Something went wrong. Please try again.");
        setIsDeleting(false);
        return;
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
