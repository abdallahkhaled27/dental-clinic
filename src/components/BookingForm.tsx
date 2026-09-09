"use client";

import { useState, type FormEvent } from "react";
import type { Dentist } from "@prisma/client";
import { services } from "@/lib/clinic-data";
import { timeSlots } from "@/lib/appointments";

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
      <div className="rounded-lg border border-black/10 p-8 text-center dark:border-white/10">
        <h2 className="text-xl font-semibold">Appointment requested!</h2>
        <p className="mt-2 opacity-70">
          We&apos;ll reach out to confirm your appointment shortly.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Book another appointment
        </button>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full Name"
          name="name"
          type="text"
          required
          defaultValue={defaultName}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
        />
        <Field label="Phone" name="phone" type="tel" required />

        <div>
          <label htmlFor="serviceId" className="block text-sm font-medium">
            Service
          </label>
          <select
            id="serviceId"
            name="serviceId"
            required
            className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dentistId" className="block text-sm font-medium">
            Dentist
          </label>
          <select
            id="dentistId"
            name="dentistId"
            required
            className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          >
            <option value="">Select a dentist</option>
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>
                {dentist.name} — {dentist.specialty}
              </option>
            ))}
          </select>
        </div>

        <Field label="Date" name="date" type="date" required min={today} />

        <div>
          <label htmlFor="time" className="block text-sm font-medium">
            Time
          </label>
          <select
            id="time"
            name="time"
            required
            className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
          >
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
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? "Submitting..." : "Request Appointment"}
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
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  min?: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        min={min}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
      />
    </div>
  );
}
