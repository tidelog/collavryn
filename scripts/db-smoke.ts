import "dotenv/config";

import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const testId = randomUUID();

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: `alice-${testId}@example.com`,
        name: "Alice",
      },
    });

    const organisation = await tx.organisation.create({
      data: {
        name: "Acme",
        slug: `acme-${testId}`,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organisationId: organisation.id,
        role: "OWNER",
      },
    });

    return tx.organisation.findUniqueOrThrow({
      where: {
        id: organisation.id,
      },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });
  });

  const owner = result.memberships.find(
    (membership) => membership.role === "OWNER",
  );

  if (
    result.name !== "Acme" ||
    result.memberships.length !== 1 ||
    owner?.user.name !== "Alice"
  ) {
    throw new Error("Database verification failed");
  }

  console.log("Database transaction succeeded.");
  console.log(`Organisation: ${result.name}`);
  console.log(`Owner: ${owner.user.name}`);
  console.log(`Role: ${owner.role}`);
  console.log(`Memberships: ${result.memberships.length}`);

  await prisma.organisation.delete({
    where: { id: result.id },
  });

  await prisma.user.delete({
    where: { id: owner.userId },
  });

  console.log("Test records cleaned up.");
}

main()
  .catch((error) => {
    console.error("Database smoke test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
