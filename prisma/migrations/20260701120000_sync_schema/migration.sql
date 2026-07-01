-- Sync the migration history with the current Prisma schema.
-- The original init migration created a legacy IntakeStatus value, REVIEW,
-- that no longer exists in prisma/schema.prisma. PostgreSQL cannot drop an
-- enum value directly, so recreate the enum after moving legacy rows.

UPDATE "Intake"
SET "status" = 'ASSESSMENT'
WHERE "status"::text = 'REVIEW';

ALTER TABLE "Intake" ALTER COLUMN "status" DROP DEFAULT;

ALTER TYPE "IntakeStatus" RENAME TO "IntakeStatus_old";

CREATE TYPE "IntakeStatus" AS ENUM (
  'NEW',
  'CARE_GUIDE_ASSIGNED',
  'ASSESSMENT',
  'CARE_PLAN',
  'MATCHED',
  'VISIT_SCHEDULED',
  'PROVIDER_RESPONSE',
  'PLACEMENT_IN_PROGRESS',
  'PLACED',
  'FOLLOW_UP_7',
  'FOLLOW_UP_30',
  'FOLLOW_UP_90',
  'CLOSED'
);

ALTER TABLE "Intake"
  ALTER COLUMN "status" TYPE "IntakeStatus"
  USING ("status"::text::"IntakeStatus");

ALTER TABLE "Intake" ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "IntakeStatus_old";

-- These indexes are declared in prisma/schema.prisma but were missing from
-- the hand-written migration history.
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "Verification_identifier_idx" ON "Verification"("identifier");
