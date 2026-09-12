"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leadStatuses, type LeadStatus } from "@/lib/leads";

export default function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(next: LeadStatus) {
    const previous = current;
    setCurrent(next);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error ?? "Something went wrong. Please try again.");
        setCurrent(previous);
        return;
      }
      router.refresh();
    } catch {
      alert("Couldn't reach the server. Please try again.");
      setCurrent(previous);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <select
      value={current}
      disabled={isSaving}
      onChange={(event) => handleChange(event.target.value as LeadStatus)}
      className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {leadStatuses.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
