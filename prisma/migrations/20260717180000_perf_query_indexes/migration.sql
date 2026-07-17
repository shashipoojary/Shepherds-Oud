-- Safe additive indexes for common query paths (family intakes, matches, waitlist, retention).
-- Concurrent-safe on Postgres; IF NOT EXISTS avoids failures if an index already exists.

CREATE INDEX IF NOT EXISTS "Intake_userId_idx" ON "Intake"("userId");
CREATE INDEX IF NOT EXISTS "Intake_status_idx" ON "Intake"("status");
CREATE INDEX IF NOT EXISTS "Match_providerId_idx" ON "Match"("providerId");
CREATE INDEX IF NOT EXISTS "Match_status_idx" ON "Match"("status");
CREATE INDEX IF NOT EXISTS "ActionLog_createdAt_idx" ON "ActionLog"("createdAt");
CREATE INDEX IF NOT EXISTS "WaitlistEntry_status_idx" ON "WaitlistEntry"("status");
CREATE INDEX IF NOT EXISTS "WaitlistEntry_email_idx" ON "WaitlistEntry"("email");
CREATE INDEX IF NOT EXISTS "Provider_email_idx" ON "Provider"("email");
