CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "enrollments_studentId_courseCode_key" ON "enrollments"("studentId", "courseCode");
CREATE INDEX "enrollments_courseCode_idx" ON "enrollments"("courseCode");

ALTER TABLE "enrollments"
  ADD CONSTRAINT "enrollments_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;