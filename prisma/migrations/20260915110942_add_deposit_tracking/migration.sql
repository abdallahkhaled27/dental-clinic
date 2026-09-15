-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "depositStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "depositAmount" INTEGER,
ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
-- Every existing row has stripeSessionId = NULL, and Postgres treats
-- every NULL in a unique index as distinct from every other NULL, so
-- this is safe to add against live data with nothing to backfill.
CREATE UNIQUE INDEX "Appointment_stripeSessionId_key" ON "Appointment"("stripeSessionId");
