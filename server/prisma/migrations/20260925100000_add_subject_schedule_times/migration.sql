ALTER TABLE "subjects"
  ADD COLUMN "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "startTime" TEXT NOT NULL DEFAULT '08:00',
  ADD COLUMN "endTime" TEXT NOT NULL DEFAULT '09:00';

ALTER TABLE "subjects"
  ADD CONSTRAINT "subjects_dayOfWeek_check" CHECK ("dayOfWeek" BETWEEN 1 AND 7),
  ADD CONSTRAINT "subjects_startTime_format_check" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT "subjects_endTime_format_check" CHECK ("endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
