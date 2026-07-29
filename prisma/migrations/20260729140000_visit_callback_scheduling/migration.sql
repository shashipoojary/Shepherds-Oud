-- Non-blind visit/callback scheduling: calendar connections + Match slot fields
DO $$ BEGIN
  CREATE TYPE "CalendarPlatform" AS ENUM ('GOOGLE', 'MICROSOFT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CalendarSyncStatus" AS ENUM ('ACTIVE', 'NEEDS_REAUTH', 'DISCONNECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SchedulingMode" AS ENUM ('CALENDAR', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SchedulingStatus" AS ENUM ('AWAITING_FAMILY', 'AWAITING_PROVIDER', 'CONFIRMED', 'CANCELLED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ProviderCalendarConnection" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "platform" "CalendarPlatform" NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "refreshTokenEnc" TEXT NOT NULL,
    "accessTokenEnc" TEXT,
    "accessTokenExp" TIMESTAMP(3),
    "calendarId" TEXT NOT NULL,
    "calendarName" TEXT,
    "syncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'ACTIVE',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderCalendarConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProviderBookingSettings" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "visitDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "callbackDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 15,
    "horizonDays" INTEGER NOT NULL DEFAULT 14,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Amsterdam',
    "activeCalendarConnectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderBookingSettings_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "schedulingMode" "SchedulingMode";
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "schedulingStatus" "SchedulingStatus";
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "proposedStartsAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "proposedEndsAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "alternateStartsAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "alternateEndsAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "confirmedStartsAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "confirmedEndsAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "calendarEventId" TEXT;
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "calendarPlatform" "CalendarPlatform";
ALTER TABLE "Match" ADD COLUMN IF NOT EXISTS "schedulingExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "ProviderCalendarConnection_providerId_platform_accountEmail_key"
  ON "ProviderCalendarConnection"("providerId", "platform", "accountEmail");
CREATE INDEX IF NOT EXISTS "ProviderCalendarConnection_providerId_idx" ON "ProviderCalendarConnection"("providerId");
CREATE INDEX IF NOT EXISTS "ProviderCalendarConnection_syncStatus_idx" ON "ProviderCalendarConnection"("syncStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "ProviderBookingSettings_providerId_key" ON "ProviderBookingSettings"("providerId");
CREATE INDEX IF NOT EXISTS "Match_schedulingStatus_idx" ON "Match"("schedulingStatus");

DO $$ BEGIN
  ALTER TABLE "ProviderCalendarConnection" ADD CONSTRAINT "ProviderCalendarConnection_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProviderBookingSettings" ADD CONSTRAINT "ProviderBookingSettings_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProviderBookingSettings" ADD CONSTRAINT "ProviderBookingSettings_activeCalendarConnectionId_fkey"
    FOREIGN KEY ("activeCalendarConnectionId") REFERENCES "ProviderCalendarConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
