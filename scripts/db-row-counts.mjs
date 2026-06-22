import { PrismaClient } from "@prisma/client";

const url = process.argv[2];
const label = process.argv[3] || "database";

if (!url) {
  console.error("Usage: node scripts/db-row-counts.mjs <DATABASE_URL> [label]");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url } }
});

const tables = [
  "Intake",
  "Provider",
  "Match",
  "WaitlistEntry",
  "User",
  "ActionLog",
  "Session",
  "Account"
];

try {
  console.log(`\n${label}`);
  console.log("-".repeat(label.length));
  for (const table of tables) {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "${table}"`);
    const n = rows[0]?.n ?? "?";
    console.log(`${table.padEnd(14)} ${n}`);
  }
} finally {
  await prisma.$disconnect();
}
