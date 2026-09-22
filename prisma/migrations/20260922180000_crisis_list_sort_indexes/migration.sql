-- Admin/partner list sorts
CREATE INDEX IF NOT EXISTS "CareCase_updatedAt_idx" ON "CareCase"("updatedAt");
CREATE INDEX IF NOT EXISTS "PlacementReferral_referredAt_idx" ON "PlacementReferral"("referredAt");
