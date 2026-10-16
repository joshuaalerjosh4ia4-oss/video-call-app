DELETE FROM "enrollments" AS old_enrollment
USING "subjects" AS subject
WHERE old_enrollment."courseCode" = subject."joinCode"
  AND EXISTS (
    SELECT 1
    FROM "enrollments" AS current_enrollment
    WHERE current_enrollment."studentId" = old_enrollment."studentId"
      AND current_enrollment."courseCode" = subject."id"
  );

UPDATE "enrollments" AS enrollment
SET "courseCode" = subject."id"
FROM "subjects" AS subject
WHERE enrollment."courseCode" = subject."joinCode";

ALTER TABLE "subjects" DROP COLUMN "joinCode";
