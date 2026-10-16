ALTER TABLE "subjects" ADD COLUMN "joinCode" TEXT;

DO $$
DECLARE
    subject_row RECORD;
    candidate_code TEXT;
BEGIN
    IF (SELECT COUNT(*) FROM "subjects") > 900000 THEN
        RAISE EXCEPTION 'Cannot assign unique six-digit subject join codes to more than 900000 subjects';
    END IF;

    FOR subject_row IN SELECT "id" FROM "subjects" LOOP
        LOOP
            candidate_code := (FLOOR(random() * 900000)::INTEGER + 100000)::TEXT;
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM "subjects" WHERE "joinCode" = candidate_code
            );
        END LOOP;
        UPDATE "subjects" SET "joinCode" = candidate_code WHERE "id" = subject_row."id";
    END LOOP;
END $$;

ALTER TABLE "subjects" ALTER COLUMN "joinCode" SET NOT NULL;
CREATE UNIQUE INDEX "subjects_joinCode_key" ON "subjects"("joinCode");
