import { expect, test } from "@playwright/test";

test("registration cannot submit before JavaScript is available", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
  });

  try {
    const page = await context.newPage();

    await page.goto("/register");

    const submitButton = page.getByRole("button", {
      name: "Create account",
    });

    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();

    await expect(page.locator("form")).toHaveAttribute(
      "method",
      "post",
    );
  } finally {
    await context.close();
  }
});
