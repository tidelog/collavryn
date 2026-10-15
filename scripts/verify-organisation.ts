import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const organisationId = process.argv[2];
  const email = process.argv[3];

  if (
    !organisationId ||
    !/^[0-9a-f-]{36}$/i.test(organisationId) ||
    !email ||
    !/^browser-test-[0-9a-f-]{36}@example\.com$/i.test(email)
  ) {
    throw new Error("Invalid verification arguments");
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const organisation = await prisma.organisation.findUnique({
      where: { id: organisationId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!organisation) {
      throw new Error("Organisation was not created");
    }

    const ownership = organisation.memberships.find(
      (membership) =>
        membership.user.email === email &&
        membership.role === "OWNER",
    );

    if (!ownership) {
      throw new Error("Creator does not have OWNER membership");
    }

    console.log("PASS: Organisation exists in PostgreSQL");
    console.log("PASS: Creator has OWNER membership");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Organisation verification failed:", error.message);
  process.exitCode = 1;
});
