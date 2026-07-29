-- Hospital referral demo: HOSPITAL role, Hospital org, invites, Intake referral tagging.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HOSPITAL';

DO $$ BEGIN
  CREATE TYPE "IntakeReferralSource" AS ENUM ('FAMILY_SELF', 'HOSPITAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "HospitalInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "HospitalInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "HospitalInviteStatus" NOT NULL DEFAULT 'PENDING',
    "hospitalId" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HospitalInvite_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedHospitalId" TEXT;

ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "referralSource" "IntakeReferralSource" NOT NULL DEFAULT 'FAMILY_SELF';
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "referringHospitalId" TEXT;
ALTER TABLE "Intake" ADD COLUMN IF NOT EXISTS "referredByUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "HospitalInvite_tokenHash_key" ON "HospitalInvite"("tokenHash");
CREATE INDEX IF NOT EXISTS "Hospital_email_idx" ON "Hospital"("email");
CREATE INDEX IF NOT EXISTS "HospitalInvite_email_idx" ON "HospitalInvite"("email");
CREATE INDEX IF NOT EXISTS "HospitalInvite_status_idx" ON "HospitalInvite"("status");
CREATE INDEX IF NOT EXISTS "HospitalInvite_hospitalId_idx" ON "HospitalInvite"("hospitalId");
CREATE INDEX IF NOT EXISTS "HospitalInvite_invitedById_idx" ON "HospitalInvite"("invitedById");
CREATE INDEX IF NOT EXISTS "User_linkedHospitalId_idx" ON "User"("linkedHospitalId");
CREATE INDEX IF NOT EXISTS "Intake_referralSource_idx" ON "Intake"("referralSource");
CREATE INDEX IF NOT EXISTS "Intake_referringHospitalId_idx" ON "Intake"("referringHospitalId");

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_linkedHospitalId_fkey"
    FOREIGN KEY ("linkedHospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "HospitalInvite" ADD CONSTRAINT "HospitalInvite_hospitalId_fkey"
    FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "HospitalInvite" ADD CONSTRAINT "HospitalInvite_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Intake" ADD CONSTRAINT "Intake_referringHospitalId_fkey"
    FOREIGN KEY ("referringHospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Intake" ADD CONSTRAINT "Intake_referredByUserId_fkey"
    FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
