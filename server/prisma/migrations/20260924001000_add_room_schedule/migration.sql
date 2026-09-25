-- Add room ownership and the teacher-provided joining window.
ALTER TABLE "rooms"
  ADD COLUMN "ownerId" TEXT,
  ADD COLUMN "startsAt" TIMESTAMP(3),
  ADD COLUMN "endsAt" TIMESTAMP(3);

CREATE INDEX "rooms_ownerId_idx" ON "rooms"("ownerId");

ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;