-- Crisis Triage V2 additive models (parallel to legacy Intake/Match)

CREATE TYPE "CareCaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "CareUrgency" AS ENUM ('TODAY', 'THIS_WEEK', 'THIS_MONTH');
CREATE TYPE "CarePath" AS ENUM ('HOME_CARE', 'FACILITY', 'BOTH', 'UNDECIDED');
CREATE TYPE "CareCaseMemberRole" AS ENUM ('FAMILY', 'PATIENT');
CREATE TYPE "ConsentAuthorityType" AS ENUM ('SELF_ATTESTED', 'LEGAL_REPRESENTATIVE_ON_FILE', 'PATIENT_GRANTED');
CREATE TYPE "PatientConsentStatus" AS ENUM ('PENDING', 'GRANTED', 'REVOKED', 'NOT_APPLICABLE');
CREATE TYPE "ChecklistTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE');
CREATE TYPE "DirectoryProviderType" AS ENUM ('RESIDENTIAL', 'HOME_CARE');
CREATE TYPE "DirectoryProviderSource" AS ENUM ('GEMEENTE_WMO', 'HAND_CURATED');
CREATE TYPE "DirectoryVerifiedStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'HIDDEN');
CREATE TYPE "PlacementFeeStatus" AS ENUM ('PENDING', 'INVOICED', 'PAID', 'DECLINED');

CREATE TABLE "CareCase" (
    "id" TEXT NOT NULL,
    "status" "CareCaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "urgencyLevel" "CareUrgency",
    "chosenPath" "CarePath",
    "preferredLocale" TEXT NOT NULL DEFAULT 'nl',
    "anonymousClaimToken" TEXT,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CareCaseMember" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "CareCaseMemberRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "preferredLocale" TEXT NOT NULL DEFAULT 'nl',
    "relationshipToPatient" TEXT,
    "consentAuthorityType" "ConsentAuthorityType",
    "dateOfBirth" TIMESTAMP(3),
    "mobilityStatus" TEXT,
    "cognitiveStatus" TEXT,
    "fundingContext" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consentStatus" "PatientConsentStatus" NOT NULL DEFAULT 'PENDING',
    "visibilityPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inviteTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareCaseMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TriageResponse" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriageResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChecklistTask" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "status" "ChecklistTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "externalLink" TEXT,
    "staleNotifiedAt" TIMESTAMP(3),
    "deadlineNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "subjectUserId" TEXT,
    "action" TEXT NOT NULL,
    "authorityType" "ConsentAuthorityType",
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DirectoryProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DirectoryProviderType" NOT NULL,
    "municipality" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fundingAccepted" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "websiteUrl" TEXT,
    "source" "DirectoryProviderSource" NOT NULL,
    "verifiedStatus" "DirectoryVerifiedStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "linkedProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectoryProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlacementReferral" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "directoryProviderId" TEXT NOT NULL,
    "referredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "feeStatus" "PlacementFeeStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementReferral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CareCase_anonymousClaimToken_key" ON "CareCase"("anonymousClaimToken");
CREATE INDEX "CareCase_status_idx" ON "CareCase"("status");
CREATE INDEX "CareCase_anonymousClaimToken_idx" ON "CareCase"("anonymousClaimToken");

CREATE UNIQUE INDEX "CareCaseMember_inviteTokenHash_key" ON "CareCaseMember"("inviteTokenHash");
CREATE INDEX "CareCaseMember_caseId_idx" ON "CareCaseMember"("caseId");
CREATE INDEX "CareCaseMember_userId_idx" ON "CareCaseMember"("userId");
CREATE INDEX "CareCaseMember_role_idx" ON "CareCaseMember"("role");

CREATE UNIQUE INDEX "TriageResponse_caseId_key" ON "TriageResponse"("caseId");

CREATE INDEX "ChecklistTask_caseId_sortOrder_idx" ON "ChecklistTask"("caseId", "sortOrder");
CREATE INDEX "ChecklistTask_deadline_idx" ON "ChecklistTask"("deadline");
CREATE INDEX "ChecklistTask_status_idx" ON "ChecklistTask"("status");

CREATE INDEX "ConsentRecord_caseId_createdAt_idx" ON "ConsentRecord"("caseId", "createdAt");

CREATE UNIQUE INDEX "DirectoryProvider_linkedProviderId_key" ON "DirectoryProvider"("linkedProviderId");
CREATE INDEX "DirectoryProvider_municipality_idx" ON "DirectoryProvider"("municipality");
CREATE INDEX "DirectoryProvider_type_idx" ON "DirectoryProvider"("type");
CREATE INDEX "DirectoryProvider_verifiedStatus_idx" ON "DirectoryProvider"("verifiedStatus");

CREATE INDEX "PlacementReferral_caseId_idx" ON "PlacementReferral"("caseId");
CREATE INDEX "PlacementReferral_directoryProviderId_idx" ON "PlacementReferral"("directoryProviderId");
CREATE INDEX "PlacementReferral_feeStatus_idx" ON "PlacementReferral"("feeStatus");

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

ALTER TABLE "CareCaseMember" ADD CONSTRAINT "CareCaseMember_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CareCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CareCaseMember" ADD CONSTRAINT "CareCaseMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TriageResponse" ADD CONSTRAINT "TriageResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CareCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChecklistTask" ADD CONSTRAINT "ChecklistTask_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CareCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CareCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DirectoryProvider" ADD CONSTRAINT "DirectoryProvider_linkedProviderId_fkey" FOREIGN KEY ("linkedProviderId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlacementReferral" ADD CONSTRAINT "PlacementReferral_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "CareCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlacementReferral" ADD CONSTRAINT "PlacementReferral_directoryProviderId_fkey" FOREIGN KEY ("directoryProviderId") REFERENCES "DirectoryProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
