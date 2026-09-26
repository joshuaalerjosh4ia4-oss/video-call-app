ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "users" SET "emailVerified" = true;

CREATE TABLE "email_verification_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_verification_codes_userId_key" ON "email_verification_codes"("userId");

ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;