CREATE TYPE "AdmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'FINALIZED', 'REJECTED');
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID');

CREATE TABLE "course_sections" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "course" TEXT NOT NULL, "yearLevel" INTEGER NOT NULL,
  "semester" TEXT NOT NULL, "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "course_sections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "course_sections_code_key" ON "course_sections"("code");
CREATE INDEX "course_sections_course_semester_yearLevel_idx" ON "course_sections"("course", "semester", "yearLevel");
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "subjects" (
  "id" TEXT NOT NULL, "code" TEXT NOT NULL, "title" TEXT NOT NULL, "units" INTEGER NOT NULL,
  "sectionId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "subjects_sectionId_code_key" ON "subjects"("sectionId", "code");
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "course_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "admissions" (
  "id" TEXT NOT NULL, "studentId" TEXT NOT NULL, "sectionId" TEXT NOT NULL,
  "status" "AdmissionStatus" NOT NULL DEFAULT 'DRAFT', "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "enrollmentFee" DECIMAL(10,2) NOT NULL, "subjectFees" DECIMAL(10,2) NOT NULL, "otherFees" DECIMAL(10,2) NOT NULL,
  "totalFees" DECIMAL(10,2) NOT NULL, "submittedAt" TIMESTAMP(3), "finalizedAt" TIMESTAMP(3), "codesSentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "admissions_studentId_sectionId_key" ON "admissions"("studentId", "sectionId");
CREATE INDEX "admissions_status_paymentStatus_idx" ON "admissions"("status", "paymentStatus");
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admissions" ADD CONSTRAINT "admissions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "course_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "admission_subjects" (
  "admissionId" TEXT NOT NULL, "subjectId" TEXT NOT NULL,
  CONSTRAINT "admission_subjects_pkey" PRIMARY KEY ("admissionId", "subjectId")
);
ALTER TABLE "admission_subjects" ADD CONSTRAINT "admission_subjects_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "admissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admission_subjects" ADD CONSTRAINT "admission_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;