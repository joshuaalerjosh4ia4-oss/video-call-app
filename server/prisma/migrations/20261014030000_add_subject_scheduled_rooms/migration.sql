ALTER TABLE "rooms"
  ADD COLUMN "subjectId" TEXT;

CREATE INDEX "rooms_subjectId_startsAt_endsAt_idx"
  ON "rooms"("subjectId", "startsAt", "endsAt");

ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "subjects"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
