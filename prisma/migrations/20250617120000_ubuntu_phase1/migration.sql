-- Step 1: Add new IntakeStatus enum values only.
-- PostgreSQL requires these to commit before the new values can be used in UPDATE/INSERT.

ALTER TYPE "IntakeStatus" ADD VALUE IF NOT EXISTS 'ASSESSMENT';
ALTER TYPE "IntakeStatus" ADD VALUE IF NOT EXISTS 'VISIT_SCHEDULED';
ALTER TYPE "IntakeStatus" ADD VALUE IF NOT EXISTS 'PLACEMENT_IN_PROGRESS';
