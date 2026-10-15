import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const email = process.argv[2];

  if (
    !email ||
    !/^browser-test-[0-9a-f-]{36}@example\.com$/i.test(email)
  ) {
    throw new Error("Invalid browser-test email");
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl,
    }),
  });

  try {
    const result = await prisma.user.deleteMany({
      where: { email },
    });

    console.log(
      `Temporary browser-test accounts deleted: ${result.count}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Browser-test cleanup failed:", error);
  process.exitCode = 1;
});
