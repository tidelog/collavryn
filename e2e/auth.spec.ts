import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test("a user can register, sign in, and sign out", async ({ page }) => {
  const email = `browser-test-${randomUUID()}@example.com`;
  const password = `SecureTestPassword-${randomUUID()}`;

  try {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", {
        name: "Create your Collavryn account",
      }),
    ).toBeVisible();

    const registrationForm = page.locator("form:visible");

    const createAccountButton = registrationForm.getByRole("button", {
      name: "Create account",
    });

    await expect(createAccountButton).toBeEnabled();

    await registrationForm.locator('input[name="name"]').fill("Browser Test User");
    await registrationForm.locator('input[name="email"]').fill(email);
    await registrationForm.locator('input[name="password"]').fill(password);

    await registrationForm
      .locator('input[name="confirmPassword"]')
      .fill("DifferentPassword123!");

    await createAccountButton.click();

    await expect(
      registrationForm.getByText("Passwords do not match."),
    ).toBeVisible();

    await expect(page).toHaveURL(/\/register(?:\?|$)/);

    console.log("PASS: Mismatched passwords are rejected");

    await registrationForm
      .locator('input[name="confirmPassword"]')
      .fill(password);

    await createAccountButton.click();

    await expect(page).toHaveURL(/\/login(?:\?|$)/);

    console.log("PASS: Registration redirects to login");

    const loginForm = page.locator("form:visible");

    await expect(loginForm).toHaveCount(1);

    await loginForm.locator('input[name="email"]').fill(email);
    await loginForm.locator('input[name="password"]').fill(password);

    await loginForm.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await expect(page.getByText(email)).toBeVisible();

    console.log("PASS: User can sign in and access dashboard");

    const invalidNameResponse = await page.request.post(
      "/api/organisations",
      {
        data: {
          name: "A",
        },
      },
    );

    expect(invalidNameResponse.status()).toBe(400);

    const unexpectedFieldResponse = await page.request.post(
      "/api/organisations",
      {
        data: {
          name: "Engineering",
          role: "OWNER",
        },
      },
    );

    expect(unexpectedFieldResponse.status()).toBe(400);

    const malformedJsonResponse = await page.request.post(
      "/api/organisations",
      {
        data: "{invalid-json",
        headers: {
          "content-type": "application/json",
        },
      },
    );

    expect(malformedJsonResponse.status()).toBe(400);

    const oversizedResponse = await page.request.post(
      "/api/organisations",
      {
        data: {
          name: "X".repeat(5000),
        },
      },
    );

    expect(oversizedResponse.status()).toBe(413);

    console.log("PASS: Invalid organisation requests are rejected");

    const organisationResponse = await page.request.post(
      "/api/organisations",
      {
        data: {
          name: "Browser Test Organisation",
        },
      },
    );

    expect(organisationResponse.status()).toBe(201);

    const organisationResult = await organisationResponse.json();

    expect(organisationResult.organisation.name).toBe(
      "Browser Test Organisation",
    );

    const organisationId = organisationResult.organisation.id;

    execFileSync(
      "npx",
      [
        "tsx",
        "scripts/verify-organisation.ts",
        organisationId,
        email,
      ],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      },
    );


    const listingResponse = await page.request.get("/api/organisations");
    expect(listingResponse.status()).toBe(200);

    const listingResult = await listingResponse.json();
    expect(
      listingResult.organisations.some(
        (organisation: { id: string }) => organisation.id === organisationId,
      ),
    ).toBe(true);

    const slug = organisationResult.organisation.slug;
    const membersEndpoint = `/api/organisations/${slug}/members`;

    const membersResponse = await page.request.get(membersEndpoint);
    expect(membersResponse.status()).toBe(200);

    const membersResult = await membersResponse.json();
    expect(membersResult.currentUserRole).toBe("OWNER");
    expect(membersResult.members).toHaveLength(1);

    const ownerMembershipId = membersResult.members[0].id;

    const removeOwnerResponse = await page.request.delete(
      `${membersEndpoint}/${ownerMembershipId}`,
    );

    expect(removeOwnerResponse.status()).toBe(409);

    const demoteOwnerResponse = await page.request.patch(
      `${membersEndpoint}/${ownerMembershipId}`,
      { data: { role: "MEMBER" } },
    );

    expect(demoteOwnerResponse.status()).toBe(409);

    const invalidMemberResponse = await page.request.post(
      membersEndpoint,
      { data: { email: "not-a-valid-email" } },
    );

    expect(invalidMemberResponse.status()).toBe(400);

    const ownerAfter = await page.request.get(membersEndpoint);
    const ownerAfterResult = await ownerAfter.json();

    expect(ownerAfterResult.members).toHaveLength(1);
    expect(ownerAfterResult.members[0].role).toBe("OWNER");

    console.log("PASS: Organisation listing and owner protection");

    console.log("PASS: Authenticated organisation creation");

    await page.getByRole("button", { name: /sign out/i }).click();

    await expect(page).toHaveURL(/\/login(?:\?|$)/);

    console.log("PASS: User can sign out");

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login(?:\?|$)/);

    console.log("PASS: Signed-out user cannot access dashboard");
  } finally {
    execFileSync(
      "npx",
      ["tsx", "scripts/cleanup-e2e-user.ts", email],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      },
    );

    console.log("Temporary browser-test account cleanup completed");
  }
});
