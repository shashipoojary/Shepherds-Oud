-- Intake: richer family data and visit / follow-up tracking
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "livingSituation" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "moveInTimeline" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "mobility" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "dementiaNeeds" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "hospitalDischargeDate" TIMESTAMP(3);
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "decisionMakerName" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "decisionMakerRelationship" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "emotionalSupportNeeds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "supportTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "visitType" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "visitProviderName" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "visitNotes" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "followUp7At" TIMESTAMP(3);
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "followUp30At" TIMESTAMP(3);
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "followUp90At" TIMESTAMP(3);

-- Provider: richer profiles
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "careLevels" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "dementiaCapacity" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "fundingTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "responseTimeHours" INTEGER;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "visitAvailability" TEXT;

-- Match: decline reasons
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "declineReason" TEXT;

-- Map legacy statuses to expanded journey
UPDATE "Intake"
SET "status" = 'CARE_PLAN'
WHERE "status" = 'ASSESSMENT'
  AND "carePlanSummary" IS NOT NULL
  AND TRIM("carePlanSummary") <> '';

UPDATE "Intake"
SET "status" = 'CARE_GUIDE_ASSIGNED'
WHERE "status" = 'NEW'
  AND "careGuideId" IS NOT NULL;

UPDATE "Intake"
SET "status" = 'CARE_GUIDE_ASSIGNED'
WHERE "status" = 'ASSESSMENT'
  AND "careGuideId" IS NOT NULL
  AND ("carePathway" IS NULL OR TRIM("carePathway") = '')
  AND ("carePlanSummary" IS NULL OR TRIM("carePlanSummary") = '');
