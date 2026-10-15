import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { verify } from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const testId = randomUUID();
const email = `Test-${testId}@Example.com`;
const normalizedEmail = email.toLowerCase();
const password = "CollavrynTestPassword2026!";

async function register(body: unknown) {
  return fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function main() {
  console.log("Starting registration integration tests...\n");

  const response = await register({
    name: "Test Engineer",
    email,
    password,
  });

  assert.equal(response.status, 201, "Registration should return 201");

  const result = await response.json();

  assert.equal(result.user.email, normalizedEmail);
  assert.equal(result.user.name, "Test Engineer");
  assert.equal("passwordHash" in result.user, false);
  assert.equal("password" in result.user, false);

  console.log("PASS: Valid registration returns 201");
  console.log("PASS: API does not expose password credentials");

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  assert.ok(user, "User should exist in PostgreSQL");
  assert.ok(user.passwordHash, "Password hash should exist");

  assert.match(user.passwordHash, /^\$argon2id\$/);
  assert.notEqual(user.passwordHash, password);

  assert.equal(
    await verify(user.passwordHash, password),
    true,
  );

  console.log("PASS: User persisted in PostgreSQL");
  console.log("PASS: Email normalised to lowercase");
  console.log("PASS: Password securely hashed with Argon2id");

  const duplicate = await register({
    name: "Another Engineer",
    email: normalizedEmail,
    password,
  });

  assert.equal(duplicate.status, 409);

  console.log("PASS: Duplicate email rejected with 409");

  const invalid = await register({
    name: "A",
    email: "not-an-email",
    password: "short",
  });

  assert.equal(invalid.status, 400);

  console.log("PASS: Invalid registration rejected with 400");

  const malformed = await fetch(
    `${baseUrl}/api/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{invalid-json",
    },
  );

  assert.equal(malformed.status, 400);

  console.log("PASS: Malformed JSON rejected with 400");

  const oversized = await register({
    name: "Test Engineer",
    email: `oversized-${testId}@example.com`,
    password: "x".repeat(9000),
  });

  assert.equal(oversized.status, 413);

  console.log("PASS: Oversized request rejected with 413");

  console.log("\nAll registration integration checks passed.");
}

main()
  .catch((error) => {
    console.error("\nRegistration integration test failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email: normalizedEmail },
      });

      console.log("Temporary test account cleaned up.");
    } finally {
      await prisma.$disconnect();
    }
  });
