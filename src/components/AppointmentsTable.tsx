"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Appointment, Dentist, Service } from "@prisma/client";
import { fieldClass, labelClass } from "@/lib/ui";
import DeleteAppointmentButton from "@/components/DeleteAppointmentButton";

// Deliberately typed against @prisma/client directly, not
// AppointmentWithRelations from appointments-db.ts — that file also pulls in
// the Prisma client/Postgres driver, which must never reach a Client
// Component's bundle (see the note in appointments.ts). A type-only import
// would likely get erased fine, but there's no need to risk it for a type
// this simple to redeclare.
type AppointmentRow = Appointment & { dentist: Dentist; service: Service };

type RangeFilter = "all" | "upcoming" | "today" | "past";
type DepositFilter = "all" | "paid" | "pending" | "refunded";

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
  const [depositFilter, setDepositFilter] = useState<DepositFilter>("all");

  const filteredAppointments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return appointments.filter((appointment) => {
      if (normalizedQuery) {
        const haystack = `${appointment.name} ${appointment.email}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      if (depositFilter !== "all" && appointment.depositStatus !== depositFilter) return false;
      if (range === "today") return appointment.date === today;
      if (range === "upcoming") return appointment.date >= today;
      if (range === "past") return appointment.date < today;
      return true;
    });
  }, [appointments, query, range, depositFilter, today]);

  const hasActiveFilter = Boolean(query.trim()) || range !== "all" || depositFilter !== "all";

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
        <div className="w-full max-w-[160px]">
          <label htmlFor="deposit" className={labelClass}>
            Deposit
          </label>
          <select
            id="deposit"
            value={depositFilter}
            onChange={(event) => setDepositFilter(event.target.value as DepositFilter)}
            className={fieldClass}
          >
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRange("all");
              setDepositFilter("all");
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
                <th className="px-4 py-3 font-medium">Deposit</th>
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
                  <td className="px-4 py-3">{appointment.service.name}</td>
                  <td className="px-4 py-3">{appointment.dentist.name}</td>
                  <td className="px-4 py-3 tabular-nums">{appointment.date}</td>
                  <td className="px-4 py-3 tabular-nums">{appointment.time}</td>
                  <td className="px-4 py-3">
                    {appointment.depositStatus === "paid" ? (
                      <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
                        Paid
                      </span>
                    ) : appointment.depositStatus === "refunded" ? (
                      <span className="rounded-full bg-danger-bg px-2.5 py-1 text-xs font-medium text-danger">
                        Refunded
                      </span>
                    ) : (
                      <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        Pending
                      </span>
                    )}
                  </td>
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
                        date={appointment.date}
                        time={appointment.time}
                        depositStatus={appointment.depositStatus}
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
