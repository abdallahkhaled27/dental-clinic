-- CreateTable
CREATE TABLE "Dentist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dentist_pkey" PRIMARY KEY ("id")
);

-- Seed the initial roster with fixed ids, so this migration is
-- reproducible on every database it runs against (local, Neon, ...)
-- instead of depending on a separate seed script being run afterward.
INSERT INTO "Dentist" ("id", "name", "specialty") VALUES
    ('8fa6da19-a0a6-4457-8de4-0328662d2dfa', 'Dr. Sarah Bennett', 'General & Family Dentistry'),
    ('50281824-50a4-49d5-bf39-816c6fb1213c', 'Dr. James Okafor', 'Orthodontics'),
    ('0c086fc0-049a-4a8d-be14-6de64e08f3fc', 'Dr. Priya Nair', 'Cosmetic & Pediatric Dentistry');

-- AlterTable
-- Any appointment booked before dentists existed is assigned to Dr. Bennett
-- (the general/family dentist) as a reasonable default, then the column is
-- locked down to required going forward.
ALTER TABLE "Appointment" ADD COLUMN "dentistId" TEXT NOT NULL DEFAULT '8fa6da19-a0a6-4457-8de4-0328662d2dfa';
ALTER TABLE "Appointment" ALTER COLUMN "dentistId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
