SELECT 'Intake' AS tbl, COUNT(*)::int AS n FROM "Intake"
UNION ALL SELECT 'Provider', COUNT(*)::int FROM "Provider"
UNION ALL SELECT 'Match', COUNT(*)::int FROM "Match"
UNION ALL SELECT 'WaitlistEntry', COUNT(*)::int FROM "WaitlistEntry"
UNION ALL SELECT 'User', COUNT(*)::int FROM "User"
UNION ALL SELECT 'ActionLog', COUNT(*)::int FROM "ActionLog"
UNION ALL SELECT 'Session', COUNT(*)::int FROM "Session"
UNION ALL SELECT 'Account', COUNT(*)::int FROM "Account"
ORDER BY tbl;
