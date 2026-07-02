-- CreateEnum
CREATE TYPE "ProviderInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "ProviderInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "ProviderInviteStatus" NOT NULL DEFAULT 'PENDING',
    "waitlistEntryId" TEXT,
    "providerId" TEXT,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderInvite_tokenHash_key" ON "ProviderInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "ProviderInvite_email_idx" ON "ProviderInvite"("email");

-- CreateIndex
CREATE INDEX "ProviderInvite_status_idx" ON "ProviderInvite"("status");

-- CreateIndex
CREATE INDEX "ProviderInvite_waitlistEntryId_idx" ON "ProviderInvite"("waitlistEntryId");

-- CreateIndex
CREATE INDEX "ProviderInvite_invitedById_idx" ON "ProviderInvite"("invitedById");

-- AddForeignKey
ALTER TABLE "ProviderInvite" ADD CONSTRAINT "ProviderInvite_waitlistEntryId_fkey" FOREIGN KEY ("waitlistEntryId") REFERENCES "WaitlistEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderInvite" ADD CONSTRAINT "ProviderInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
