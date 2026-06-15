-- AlterTable
ALTER TABLE "User" ADD COLUMN "linkedProviderId" TEXT;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "contactName" TEXT,
ADD COLUMN "email" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "province" TEXT,
ADD COLUMN "website" TEXT,
ADD COLUMN "availabilityStatus" TEXT,
ADD COLUMN "adminNotes" TEXT,
ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_linkedProviderId_key" ON "User"("linkedProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_intakeId_providerId_key" ON "Match"("intakeId", "providerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_linkedProviderId_fkey" FOREIGN KEY ("linkedProviderId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'CONTACTED';
ALTER TYPE "MatchStatus" ADD VALUE 'PLACED';
ALTER TYPE "MatchStatus" ADD VALUE 'CLOSED';
