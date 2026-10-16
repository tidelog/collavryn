#!/usr/bin/env node

const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
];

const missing = required.filter((name) => {
  const value = process.env[name];

  return typeof value !== "string" || value.trim() === "";
});

if (missing.length > 0) {
  console.error(
    "Missing production environment variables:",
    missing.join(", "),
  );

  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

let parsed;

try {
  parsed = new URL(databaseUrl);
} catch {
  console.error("DATABASE_URL is not a valid URL");
  process.exit(1);
}

if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
  console.error("DATABASE_URL must use PostgreSQL");
  process.exit(1);
}

if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
  console.error("DATABASE_URL must specify a host and database");
  process.exit(1);
}

const secret = process.env.AUTH_SECRET;

if (secret.length < 32) {
  console.error("AUTH_SECRET must contain at least 32 characters");
  process.exit(1);
}

if (
  secret === "collavryn-ci-only-secret-not-for-production-2026"
) {
  console.error("The CI authentication secret cannot be used in production");
  process.exit(1);
}

console.log("PASS: Required production environment variables are configured");
console.log("PASS: PostgreSQL connection URL is structurally valid");
console.log("PASS: Authentication secret meets minimum length requirements");
console.log("NOTE: Database connectivity and deployment credentials are not tested");
