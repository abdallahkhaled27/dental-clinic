"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Appointment, Dentist } from "@prisma/client";
import { services } from "@/lib/clinic-data";
import { fieldClass, labelClass } from "@/lib/ui";
import DeleteAppointmentButton from "@/components/DeleteAppointmentButton";

// Deliberately typed against @prisma/client directly, not
// AppointmentWithDentist from appointments-db.ts — that file also pulls in
// the Prisma client/Postgres driver, which must never reach a Client
// Component's bundle (see the note in appointments.ts). A type-only import
// would likely get erased fine, but there's no need to risk it for a type
// this simple to redeclare.
type AppointmentRow = Appointment & { dentist: Dentist };

type RangeFilter = "all" | "upcoming" | "today" | "past";

function serviceName(serviceId: string) {
  return services.find((service) => service.id === serviceId)?.name ?? serviceId;
}

// Filters entirely client-side, live as staff type — the full appointment
// list is already loaded on the page (no pagination), so there's nothing
// to fetch and no debounce needed at this scale.
export default function AppointmentsTable({
  appointments,
  today,
}: {
  appointments: AppointmentRow[];
  today: string;
}) {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeFilter>("all");

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return appointments.filter((appointment) => {
      if (normalizedQuery) {
        const haystack = `${appointment.name} ${appointment.email}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      if (range === "today") return appointment.date === today;
      if (range === "upcoming") return appointment.date >= today;
      if (range === "past") return appointment.date < today;
      return true;
    });
  }, [appointments, query, range, today]);

  const hasActiveFilter = Boolean(query.trim()) || range !== "all";

  return (
    <>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-full max-w-[220px]">
          <label htmlFor="q" className={labelClass}>
            Search patient
          </label>
          <input
            id="q"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or email"
            className={fieldClass}
          />
        </div>
        <div className="w-full max-w-[160px]">
          <label htmlFor="range" className={labelClass}>
            Show
          </label>
          <select
            id="range"
            value={range}
            onChange={(event) => setRange(event.target.value as RangeFilter)}
            className={fieldClass}
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="past">Past</option>
          </select>
        </div>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRange("all");
            }}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {hasActiveFilter ? "No appointments match this filter." : "No appointments yet."}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02] text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Dentist</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Booked</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr
                  key={appointment.id}
                  className="border-b border-border align-top last:border-0 hover:bg-foreground/[0.02]"
                >
                  <td className="px-4 py-3 font-medium">{appointment.name}</td>
                  <td className="px-4 py-3">
                    <div>{appointment.email}</div>
                    <div className="text-muted-foreground">{appointment.phone}</div>
                  </td>
                  <td className="px-4 py-3">{serviceName(appointment.serviceId)}</td>
                  <td className="px-4 py-3">{appointment.dentist.name}</td>
                  <td className="px-4 py-3 tabular-nums">{appointment.date}</td>
                  <td className="px-4 py-3 tabular-nums">{appointment.time}</td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">
                    {appointment.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(appointment.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/appointments/${appointment.id}/edit`}
                        className="text-sm text-primary transition-opacity hover:opacity-70"
                      >
                        Edit
                      </Link>
                      <DeleteAppointmentButton
                        appointmentId={appointment.id}
                        patientName={appointment.name}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
