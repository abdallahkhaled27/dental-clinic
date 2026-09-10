"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Dentist } from "@prisma/client";
import { timeSlots, timeSlotToMinutes } from "@/lib/appointments";
import { getClinicToday, getClinicNowMinutes } from "@/lib/clinic-data";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

type Status = "idle" | "submitting" | "error";

export default function EditAppointmentForm({
  appointmentId,
  dentists,
  defaultDentistId,
  defaultDate,
  defaultTime,
  defaultNotes,
}: {
  appointmentId: string;
  dentists: Dentist[];
  defaultDentistId: string;
  defaultDate: string;
  defaultTime: string;
  defaultNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [date, setDate] = useState(defaultDate);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      dentistId: formData.get("dentistId") as string,
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      notes: formData.get("notes") as string,
    };

    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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

  const today = getClinicToday();
  const isSubmitting = status === "submitting";
  // Same reasoning as BookingForm: hide today's already-passed slots so
  // staff can't reschedule an appointment into a time that's already
  // gone by. The current time, if it's already passed, stays selectable
  // (union with defaultTime) so editing an existing today+past-time
  // appointment for some other field doesn't silently drop its time out
  // from under the form.
  const availableTimeSlots =
    date === today
      ? timeSlots.filter(
          (slot) => timeSlotToMinutes(slot) > getClinicNowMinutes() || slot === defaultTime,
        )
      : timeSlots;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="dentistId" className={labelClass}>
          Dentist
        </label>
        <select
          id="dentistId"
          name="dentistId"
          required
          disabled={isSubmitting}
          defaultValue={defaultDentistId}
          className={fieldClass}
        >
          {dentists.map((dentist) => (
            <option key={dentist.id} value={dentist.id}>
              {dentist.name} — {dentist.specialty}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className={labelClass}>
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            min={today}
            disabled={isSubmitting}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="time" className={labelClass}>
            Time
          </label>
          <select
            id="time"
            name="time"
            required
            disabled={isSubmitting}
            defaultValue={defaultTime}
            className={fieldClass}
          >
            {availableTimeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          disabled={isSubmitting}
          defaultValue={defaultNotes}
          className={fieldClass}
        />
      </div>

      {status === "error" && <ErrorBanner message={errorMessage} />}

      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
