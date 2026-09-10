-- AddUniqueConstraint
-- Prevents double-booking: no two appointments can share the same
-- dentist, date, and time.
CREATE UNIQUE INDEX "Appointment_dentistId_date_time_key" ON "Appointment"("dentistId", "date", "time");
