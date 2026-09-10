import "server-only";
import { prisma } from "./prisma";

// Admin-facing patient management — separate from patient-auth.ts, which
// is about a patient managing their *own* session, not staff looking at
// the full roster.

export function getPatientsWithAppointmentCount() {
  return prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { appointments: true } } },
  });
}

// Appointment.patientId is `onDelete: SetNull` (see schema.prisma) — this
// detaches their appointments rather than deleting them, so the clinic
// keeps its booking records even after the account is gone. Cascades to
// PatientSession too, which signs them out everywhere immediately.
export function deletePatient(id: string) {
  return prisma.patient.delete({ where: { id } });
}
