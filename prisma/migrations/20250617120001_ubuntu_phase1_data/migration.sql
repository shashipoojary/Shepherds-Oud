-- Step 2: Migrate data and add Care Guide / assessment columns (runs after enum values exist).

UPDATE "Intake" SET status = 'ASSESSMENT' WHERE status::text = 'REVIEW';

ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "careGuideId" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "carePathway" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "assessmentNotes" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "carePlanSummary" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "visitScheduledAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Intake_careGuideId_idx" ON "Intake"("careGuideId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Intake_careGuideId_fkey'
  ) THEN
    ALTER TABLE "Intake"
      ADD CONSTRAINT "Intake_careGuideId_fkey"
      FOREIGN KEY ("careGuideId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
