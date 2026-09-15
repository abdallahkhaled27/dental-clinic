-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- Seed the six services that existed as a static list in clinic-data.ts
-- (and as translation keys in messages/en.json / messages/ar.json) before
-- this migration — same ids, so every existing Appointment.serviceId
-- already matches a row here, which is what makes the FK constraint below
-- safe to add against live data.
INSERT INTO "Service" ("id", "name", "nameAr", "description", "descriptionAr") VALUES
('checkup', 'Routine Checkups & Cleaning', 'الفحص الدوري والتنظيف', 'Comprehensive exams and professional cleaning to keep your smile healthy.', 'فحوصات شاملة وتنظيف احترافي للحفاظ على صحة ابتسامتك.'),
('whitening', 'Teeth Whitening', 'تبييض الأسنان', 'Safe, effective whitening treatments for a brighter, more confident smile.', 'علاجات تبييض آمنة وفعّالة لابتسامة أكثر إشراقًا وثقة.'),
('orthodontics', 'Orthodontics', 'تقويم الأسنان', 'Braces and clear aligners for patients of all ages.', 'تقويم معدني وتقويم شفاف لجميع الأعمار.'),
('emergency', 'Emergency Care', 'حالات الطوارئ', 'Same-day appointments for dental pain, injuries, and urgent issues.', 'مواعيد في نفس اليوم لآلام الأسنان والإصابات والحالات العاجلة.'),
('cosmetic', 'Cosmetic Dentistry', 'طب الأسنان التجميلي', 'Veneers, bonding, and smile makeovers tailored to your goals.', 'قشور الأسنان، الحشوات التجميلية، وابتسامة هوليوود حسب رغبتك.'),
('pediatric', 'Pediatric Dentistry', 'طب أسنان الأطفال', 'Gentle, kid-friendly care to build healthy habits early.', 'رعاية لطيفة ومناسبة للأطفال لبناء عادات صحية مبكرًا.');

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
