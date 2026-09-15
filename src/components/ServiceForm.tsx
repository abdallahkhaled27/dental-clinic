"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

type Status = "idle" | "submitting" | "error";

// Shared by the "add service" and "edit service" admin pages — same four
// fields either way, only the HTTP method/URL and starting values differ
// (same shape as DentistForm.tsx). Both languages are edited here, not
// just English — see the Service model comment in schema.prisma for why
// a service's copy is stored bilingually on the row itself.
export default function ServiceForm({
  serviceId,
  defaultName = "",
  defaultNameAr = "",
  defaultDescription = "",
  defaultDescriptionAr = "",
}: {
  serviceId?: string;
  defaultName?: string;
  defaultNameAr?: string;
  defaultDescription?: string;
  defaultDescriptionAr?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = Boolean(serviceId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      description: formData.get("description") as string,
      descriptionAr: formData.get("descriptionAr") as string,
    };

    try {
      const response = await fetch(
        isEditing ? `/api/admin/services/${serviceId}` : "/api/admin/services",
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
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            Name (English)
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            disabled={isSubmitting}
            defaultValue={defaultName}
            placeholder="Teeth Whitening"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="nameAr" className={labelClass}>
            Name (Arabic)
          </label>
          <input
            id="nameAr"
            name="nameAr"
            type="text"
            required
            dir="rtl"
            disabled={isSubmitting}
            defaultValue={defaultNameAr}
            placeholder="تبييض الأسنان"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description (English)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          required
          disabled={isSubmitting}
          defaultValue={defaultDescription}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="descriptionAr" className={labelClass}>
          Description (Arabic)
        </label>
        <textarea
          id="descriptionAr"
          name="descriptionAr"
          rows={2}
          required
          dir="rtl"
          disabled={isSubmitting}
          defaultValue={defaultDescriptionAr}
          className={fieldClass}
        />
      </div>

      {status === "error" && <ErrorBanner message={errorMessage} />}

      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Add service"}
      </button>
    </form>
  );
}
