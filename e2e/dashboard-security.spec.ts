import { expect, test } from "@playwright/test";

test("workspace dashboard rejects unauthenticated requests", async ({
  request,
}) => {
  const response = await request.get(
    "/api/organisations/unknown-workspace/overview",
  );

  expect(response.status()).toBe(401);
});
