-- Client requirements roadmap: trust, intake depth, matching, provider verification
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "fundingTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "functionalNeeds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "placementPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "seniorAgreedToSearch" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "decisionParticipants" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "personSafeTonight" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "urgentMedicalHelp" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "canRemainHomeTonight" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "caregiverBurnoutRisk" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "immediateRiskFlags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "emergencyStopped" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "consentAcceptedAt" TIMESTAMP(3);
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "consentVersion" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "caseOutcome" TEXT;

CREATE TABLE IF NOT EXISTS "DecisionMaker" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "intakeId" TEXT NOT NULL,
  CONSTRAINT "DecisionMaker_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DecisionMaker_intakeId_idx" ON "DecisionMaker"("intakeId");

DO $$ BEGIN
  ALTER TABLE "DecisionMaker" ADD CONSTRAINT "DecisionMaker_intakeId_fkey"
    FOREIGN KEY ("intakeId") REFERENCES "Intake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "DecisionMaker" ("id", "name", "relationship", "responsibilities", "createdAt", "updatedAt", "intakeId")
SELECT
  'dm_' || "id",
  "decisionMakerName",
  COALESCE(NULLIF("decisionMakerRelationship", ''), 'Not specified'),
  ARRAY[]::TEXT[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  "id"
FROM "Intake"
WHERE "decisionMakerName" IS NOT NULL
  AND TRIM("decisionMakerName") <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "DecisionMaker" dm WHERE dm."intakeId" = "Intake"."id"
  );

ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'REGISTRATION_RECEIVED';
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "legalOrganisationName" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "kvkNumber" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "agbCode" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "wtzaStatus" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "roomTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "accessibilityNotes" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "qualityInfo" TEXT;

-- Existing onboarded providers remain matchable after verification rollout
UPDATE "Provider"
SET "verificationStatus" = 'LISTING_LIVE'
WHERE "verificationStatus" = 'REGISTRATION_RECEIVED'
  AND "email" IS NOT NULL
  AND TRIM("email") <> ''
  AND COALESCE(array_length("services", 1), 0) > 0;

ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "familyFacingReason" TEXT;

ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "registrationNumber" TEXT;
ALTER TABLE "WaitlistEntry" ADD COLUMN IF NOT EXISTS "registrationVerified" BOOLEAN NOT NULL DEFAULT false;
