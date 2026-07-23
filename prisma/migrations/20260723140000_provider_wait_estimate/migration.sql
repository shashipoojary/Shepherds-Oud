-- Additive nullable wait-estimate fields for Waiting List Navigator foundation.
-- Safe for existing rows: all columns are NULL (no backfill).

ALTER TABLE "Provider" ADD COLUMN "waitEstimateMinDays" INTEGER;
ALTER TABLE "Provider" ADD COLUMN "waitEstimateMaxDays" INTEGER;
ALTER TABLE "Provider" ADD COLUMN "waitEstimateUpdatedAt" TIMESTAMP(3);
