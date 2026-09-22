import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED = [
  {
    name: "Haaglanden Thuiszorg Voorbeeld",
    type: "HOME_CARE" as const,
    municipality: "Den Haag",
    city: "Den Haag",
    languages: ["nl", "en"],
    fundingAccepted: ["Wmo", "private"],
    contactEmail: "info@example-thuiszorg.nl",
    websiteUrl: "https://www.denhaag.nl/",
    source: "HAND_CURATED" as const,
    verifiedStatus: "VERIFIED" as const
  },
  {
    name: "Woonzorg Haaglanden Voorbeeld",
    type: "RESIDENTIAL" as const,
    municipality: "Delft",
    city: "Delft",
    languages: ["nl"],
    fundingAccepted: ["Wlz", "private"],
    contactEmail: "intake@example-woonzorg.nl",
    websiteUrl: "https://www.delft.nl/",
    source: "GEMEENTE_WMO" as const,
    verifiedStatus: "VERIFIED" as const
  },
  {
    name: "Zoetermeer Zorg aan Huis",
    type: "HOME_CARE" as const,
    municipality: "Zoetermeer",
    city: "Zoetermeer",
    languages: ["nl", "en"],
    fundingAccepted: ["Wmo", "PGB"],
    source: "HAND_CURATED" as const,
    verifiedStatus: "UNVERIFIED" as const
  }
];

async function main() {
  for (const item of SEED) {
    const existing = await prisma.directoryProvider.findFirst({
      where: { name: item.name, municipality: item.municipality }
    });
    if (existing) {
      await prisma.directoryProvider.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.directoryProvider.create({ data: item });
    }
  }
  console.log(`Seeded ${SEED.length} Haaglanden directory providers.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
