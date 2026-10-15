import "dotenv/config";

import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const slug = `rollback-test-${randomUUID()}`;

  try {
    let failed = false;

    try {
      await prisma.$transaction(async (tx) => {
        const organisation = await tx.organisation.create({
          data: { name: "Rollback Test Organisation", slug },
        });

        await tx.membership.create({
          data: {
            organisationId: organisation.id,
            userId: randomUUID(),
            role: "OWNER",
          },
        });
      });
    } catch {
      failed = true;
    }

    if (!failed) throw new Error("Expected foreign-key failure");

    const remaining = await prisma.organisation.count({
      where: { slug },
    });

    if (remaining !== 0) {
      throw new Error("Transaction rollback failed");
    }

    console.log("PASS: Failed membership creation rolled back organisation");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
