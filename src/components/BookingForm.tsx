"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Dentist, Service } from "@prisma/client";
import { getClinicToday, getClinicNowMinutes } from "@/lib/clinic-data";
import { timeSlots, timeSlotToMinutes } from "@/lib/appointments";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

type Status = "idle" | "submitting" | "success" | "redirecting" | "error";

export default function BookingForm({
  dentists,
  services,
  defaultName,
  defaultEmail,
}: {
  dentists: Dentist[];
  services: Service[];
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [date, setDate] = useState("");
  const t = useTranslations("Booking");
  const tCommon = useTranslations("Common");
  // Services carry both languages directly on the row now (see the Service
  // model comment in schema.prisma) — no separate messages/*.json lookup
  // the way dentist names never needed one, so the option list below picks
  // between the two columns instead of translating through next-intl.
  const locale = useLocale();

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
      locale,
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
        setErrorMessage(data.error ?? tCommon("genericError"));
        return;
      }

      // The appointment is already booked at this point either way — a
      // missing checkoutUrl just means Stripe isn't configured in this
      // environment (see createDepositCheckoutSession), not that
      // anything failed. Redirecting to Stripe's hosted page, not
      // fetching it into an iframe or similar: card entry is entirely
      // Stripe's problem this way, never something this app's own code
      // touches.
      if (data.checkoutUrl) {
        setStatus("redirecting");
        window.location.href = data.checkoutUrl;
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(t("networkError"));
    }
  }

  if (status === "redirecting") {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <Spinner className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">{t("redirectingToPayment")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("redirectingToPaymentBody")}</p>
      </div>
    );
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
        <h2 className="mt-4 text-xl font-semibold">{t("successTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("successBody")}</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          {t("bookAnother")}
        </button>
      </div>
    );
  }

  const today = getClinicToday();
  const isSubmitting = status === "submitting";
  // Today's already-passed slots are hidden rather than just rejected on
  // submit — nothing stops a patient picking "4:30 PM" for today at
  // 10 PM otherwise, since the <select> itself doesn't know what time it
  // is. The server still enforces this too (see validateAppointmentDate),
  // this is purely so the dropdown doesn't offer an invalid choice.
  const availableTimeSlots =
    date === today
      ? timeSlots.filter((slot) => timeSlotToMinutes(slot) > getClinicNowMinutes())
      : timeSlots;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label={t("fullName")}
          name="name"
          type="text"
          required
          defaultValue={defaultName}
          disabled={isSubmitting}
        />
        <Field
          label={t("email")}
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          disabled={isSubmitting}
        />
        <Field label={t("phone")} name="phone" type="tel" required disabled={isSubmitting} />

        <div>
          <label htmlFor="serviceId" className={labelClass}>
            {t("service")}
          </label>
          <select id="serviceId" name="serviceId" required disabled={isSubmitting} className={fieldClass}>
            <option value="">{t("selectService")}</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {locale === "ar" ? service.nameAr : service.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dentistId" className={labelClass}>
            {t("dentist")}
          </label>
          <select id="dentistId" name="dentistId" required disabled={isSubmitting} className={fieldClass}>
            <option value="">{t("selectDentist")}</option>
            {dentists.map((dentist) => (
              <option key={dentist.id} value={dentist.id}>
                {dentist.name} — {dentist.specialty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className={labelClass}>
            {t("date")}
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={today}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            disabled={isSubmitting}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="time" className={labelClass}>
            {t("time")}
          </label>
          <select id="time" name="time" required disabled={isSubmitting} className={fieldClass}>
            <option value="">{t("selectTime")}</option>
            {availableTimeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {date === today && availableTimeSlots.length === 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">{t("noSlotsToday")}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          {t("notes")}
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
        {isSubmitting ? t("submitting") : t("submit")}
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
