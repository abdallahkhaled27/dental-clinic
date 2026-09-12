"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

type Status = "idle" | "submitting" | "error";

// Shared by the "add dentist" and "edit dentist" admin pages — same two
// fields either way, only the HTTP method/URL and starting values differ.
export default function DentistForm({
  dentistId,
  defaultName = "",
  defaultSpecialty = "",
}: {
  dentistId?: string;
  defaultName?: string;
  defaultSpecialty?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = Boolean(dentistId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      specialty: formData.get("specialty") as string,
    };

    try {
      const response = await fetch(
        isEditing ? `/api/admin/dentists/${dentistId}` : "/api/admin/dentists",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Please try again.");
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          disabled={isSubmitting}
          defaultValue={defaultName}
          placeholder="Dr. Jane Smith"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="specialty" className={labelClass}>
          Specialty
        </label>
        <input
          id="specialty"
          name="specialty"
          type="text"
          required
          disabled={isSubmitting}
          defaultValue={defaultSpecialty}
          placeholder="Orthodontics"
          className={fieldClass}
        />
      </div>

      {status === "error" && <ErrorBanner message={errorMessage} />}

      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Add dentist"}
      </button>
    </form>
  );
}
