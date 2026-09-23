-- Drop Care Guide (intake/match/hospital/calendar) after crisis triage cutover.
-- Remount HOSPITAL users before shrinking the Role enum.

UPDATE "User"
SET role = 'FAMILY', "linkedHospitalId" = NULL
WHERE role::text = 'HOSPITAL';

DROP TABLE IF EXISTS "Match" CASCADE;
DROP TABLE IF EXISTS "DecisionMaker" CASCADE;
DROP TABLE IF EXISTS "Intake" CASCADE;
DROP TABLE IF EXISTS "HospitalInvite" CASCADE;
DROP TABLE IF EXISTS "ProviderBookingSettings" CASCADE;
DROP TABLE IF EXISTS "ProviderCalendarConnection" CASCADE;
DROP TABLE IF EXISTS "Hospital" CASCADE;

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_linkedHospitalId_fkey";
DROP INDEX IF EXISTS "User_linkedHospitalId_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "linkedHospitalId";

CREATE TYPE "Role_new" AS ENUM ('FAMILY', 'PROVIDER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'FAMILY'::"Role_new";
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

DROP TYPE IF EXISTS "IntakeStatus";
DROP TYPE IF EXISTS "MatchStatus";
DROP TYPE IF EXISTS "IntakeReferralSource";
DROP TYPE IF EXISTS "HospitalInviteStatus";
DROP TYPE IF EXISTS "CalendarPlatform";
DROP TYPE IF EXISTS "CalendarSyncStatus";
DROP TYPE IF EXISTS "SchedulingMode";
DROP TYPE IF EXISTS "SchedulingStatus";
