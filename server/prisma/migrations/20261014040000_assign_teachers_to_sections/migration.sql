ALTER TABLE "course_sections"
  ADD COLUMN "teacherId" TEXT;

CREATE INDEX "course_sections_teacherId_idx"
  ON "course_sections"("teacherId");

ALTER TABLE "course_sections"
  ADD CONSTRAINT "course_sections_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
