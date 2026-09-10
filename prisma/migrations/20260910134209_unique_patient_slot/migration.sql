-- AddUniqueConstraint
-- Prevents a single patient from being booked with two different
-- dentists at the same date and time. NULL patientId values (legacy/guest
-- rows) never conflict with each other or anything else — Postgres
-- treats every NULL in a unique index as distinct.
CREATE UNIQUE INDEX "Appointment_patientId_date_time_key" ON "Appointment"("patientId", "date", "time");
