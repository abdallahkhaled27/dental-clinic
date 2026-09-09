"use client";

import { useState, type FormEvent } from "react";
import type { Dentist } from "@prisma/client";
import { services } from "@/lib/clinic-data";
import { timeSlots } from "@/lib/appointments";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

type Status = "idle" | "submitting" | "success" | "error";

export default function BookingForm({
  dentists,
  defaultName,
  defaultEmail,
}: {
  dentists: Dentist[];
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      serviceId: formData.get("serviceId") as string,
      dentistId: formData.get("dentistId") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      notes: formData.get("notes") as string,
    };

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(
        "Couldn't reach the server. Please check your connection and try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-success-border bg-success-bg p-8 text-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="mx-auto h-10 w-10 text-success"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l2.5 2.5L16 9" />
        </svg>
        <h2 className="mt-4 text-xl font-semibold">Appointment requested!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll reach out to confirm your appointment shortly.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          Book another appointment
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full Name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          disabled={isSubmitting}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          disabled={isSubmitting}
        />
        <Field label="Phone" name="phone" type="tel" required disabled={isSubmitting} />

        <div>
          <label htmlFor="serviceId" className={labelClass}>
            Service
          </label>
          <select id="serviceId" name="serviceId" required disabled={isSubmitting} className={fieldClass}>
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dentistId" className={labelClass}>
            Dentist
          </label>
          <select id="dentistId" name="dentistId" required disabled={isSubmitting} className={fieldClass}>
            <option value="">Select a dentist</option>
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>
                {dentist.name} — {dentist.specialty}
              </option>
            ))}
          </select>
        </div>

        <Field label="Date" name="date" type="date" required min={today} disabled={isSubmitting} />

        <div>
          <label htmlFor="time" className={labelClass}>
            Time
          </label>
          <select id="time" name="time" required disabled={isSubmitting} className={fieldClass}>
            <option value="">Select a time</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          disabled={isSubmitting}
          className={fieldClass}
        />
      </div>

      {status === "error" && <ErrorBanner message={errorMessage} />}

      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? "Submitting..." : "Request Appointment"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  required,
  min,
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  min?: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        min={min}
        defaultValue={defaultValue}
        disabled={disabled}
        className={fieldClass}
      />
    </div>
  );
}
