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
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email },
        include: {
          memberships: {
            include: {
              organisation: true,
            },
          },
        },
      });

      if (!user) {
        return { users: 0, organisations: 0 };
      }

      for (const membership of user.memberships) {
        if (
          membership.role !== "OWNER" ||
          membership.organisation.name !== "Browser Test Organisation" ||
          !membership.organisation.slug.startsWith(
            "browser-test-organisation-",
          )
        ) {
          throw new Error(
            "Unexpected membership detected. Cleanup refused.",
          );
        }

        const membershipCount = await tx.membership.count({
          where: {
            organisationId: membership.organisationId,
          },
        });

        if (membershipCount !== 1) {
          throw new Error(
            "Organisation has additional members. Cleanup refused.",
          );
        }
      }

      for (const membership of user.memberships) {
        await tx.organisation.delete({
          where: {
            id: membership.organisationId,
          },
        });
      }

      await tx.user.delete({
        where: { id: user.id },
      });

      return {
        users: 1,
        organisations: user.memberships.length,
      };
    });

    console.log(
      `Temporary browser-test accounts deleted: ${result.users}`,
    );

    console.log(
      `Temporary browser-test organisations deleted: ${result.organisations}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Browser-test cleanup failed:", error);
  process.exitCode = 1;
});
