import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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
const email = `auth-test-${testId}@example.com`;
const password = `SecureTestPassword-${randomUUID()}`;

class HttpClient {
  private cookies = new Map<string, string>();

  async request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);

    if (this.cookies.size > 0) {
      headers.set(
        "Cookie",
        [...this.cookies]
          .map(([name, value]) => `${name}=${value}`)
          .join("; "),
      );
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      redirect: "manual",
    });

    for (const cookie of response.headers.getSetCookie()) {
      const firstPart = cookie.split(";", 1)[0];
      const separator = firstPart.indexOf("=");

      if (separator < 1) {
        continue;
      }

      const name = firstPart.slice(0, separator);
      const value = firstPart.slice(separator + 1);

      if (value === "") {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }

    return response;
  }

  async csrfToken() {
    const response = await this.request("/api/auth/csrf");

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(typeof body.csrfToken, "string");

    return body.csrfToken as string;
  }

  async signIn(emailAddress: string, submittedPassword: string) {
    const csrfToken = await this.csrfToken();

    const form = new URLSearchParams({
      csrfToken,
      email: emailAddress,
      password: submittedPassword,
      callbackUrl: `${baseUrl}/dashboard`,
    });

    return this.request("/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  }

  async session() {
    const response = await this.request("/api/auth/session");

    assert.equal(response.status, 200);

    return response.json();
  }

  async signOut() {
    const csrfToken = await this.csrfToken();

    const form = new URLSearchParams({
      csrfToken,
      callbackUrl: `${baseUrl}/login`,
    });

    return this.request("/api/auth/signout", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
  }
}

async function main() {
  console.log("Starting authentication integration tests...\n");

  const anonymous = new HttpClient();

  assert.equal(await anonymous.session(), null);

  console.log("PASS: Anonymous visitor has no session");

  const registration = await anonymous.request(
    "/api/auth/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Authentication Test User",
        email,
        password,
      }),
    },
  );

  assert.equal(registration.status, 201);

  console.log("PASS: Temporary user registered");

  const invalidClient = new HttpClient();

  await invalidClient.signIn(email, "IncorrectPassword123!");

  assert.equal(await invalidClient.session(), null);

  console.log("PASS: Incorrect password does not create a session");

  const authenticated = new HttpClient();

  const loginResponse = await authenticated.signIn(
    email,
    password,
  );

  assert.ok(
    loginResponse.status >= 200 &&
      loginResponse.status < 400,
    `Unexpected login response: ${loginResponse.status}`,
  );

  const session = await authenticated.session();

  assert.ok(session?.user, "Authenticated session missing");

  assert.equal(session.user.email, email);
  assert.equal(typeof session.user.id, "string");
  assert.equal("passwordHash" in session.user, false);

  console.log("PASS: Correct credentials create a session");
  console.log("PASS: Session contains correct user identity");
  console.log("PASS: Session excludes password hash");

  const dashboard = await authenticated.request("/dashboard");

  assert.equal(dashboard.status, 200);

  const dashboardHtml = await dashboard.text();

  assert.ok(
    dashboardHtml.includes("Authentication Test User"),
    "Authenticated dashboard does not contain test user",
  );

  assert.ok(
    dashboardHtml.includes(email),
    "Authenticated dashboard does not contain expected email",
  );

  console.log("PASS: Authenticated dashboard contains user information");

  const logoutResponse = await authenticated.signOut();

  assert.ok(
    logoutResponse.status >= 200 &&
      logoutResponse.status < 400,
    `Unexpected logout response: ${logoutResponse.status}`,
  );

  assert.equal(await authenticated.session(), null);

  console.log("PASS: Signing out ends the session");

  console.log("\nAll authentication integration checks passed.");
}

main()
  .catch((error) => {
    console.error("\nAuthentication integration test failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.user.deleteMany({
        where: { email },
      });

      console.log("Temporary test account cleaned up.");
    } finally {
      await prisma.$disconnect();
    }
  });
