-- CreateEnum
CREATE TYPE "WaitlistType" AS ENUM ('FAMILY', 'FACILITY');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "type" "WaitlistType" NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "province" TEXT,
    "message" TEXT,
    "relationship" TEXT,
    "ageRange" TEXT,
    "careTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "facilityName" TEXT,
    "facilityType" TEXT,
    "bedsTotal" INTEGER,
    "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "WaitlistStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);
