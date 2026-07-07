-- Add intake fields for preferred distance and medical support needs.
-- Safe to run on production: nullable columns, no data loss.

ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "preferredDistance" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "medicalSupportNeeds" TEXT;
