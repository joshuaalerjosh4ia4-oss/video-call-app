ALTER TABLE "admission_subjects" ADD COLUMN "joinCode" TEXT;

DO $$
DECLARE
    selection_row RECORD;
    candidate_code TEXT;
BEGIN
    IF (SELECT COUNT(*) FROM "admission_subjects") > 900000 THEN
        RAISE EXCEPTION 'Cannot assign unique six-digit join codes to more than 900000 admission subjects';
    END IF;

    FOR selection_row IN SELECT "admissionId", "subjectId" FROM "admission_subjects" LOOP
        LOOP
            candidate_code := (FLOOR(random() * 900000)::INTEGER + 100000)::TEXT;
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM "admission_subjects" WHERE "joinCode" = candidate_code
            );
        END LOOP;
        UPDATE "admission_subjects"
        SET "joinCode" = candidate_code
        WHERE "admissionId" = selection_row."admissionId"
          AND "subjectId" = selection_row."subjectId";
    END LOOP;
END $$;

ALTER TABLE "admission_subjects" ALTER COLUMN "joinCode" SET NOT NULL;
CREATE UNIQUE INDEX "admission_subjects_joinCode_key" ON "admission_subjects"("joinCode");
