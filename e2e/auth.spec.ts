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
