import { expect, test } from "@playwright/test";

test("unauthenticated users cannot create organisations", async ({
  request,
}) => {
  const response = await request.post("/api/organisations", {
    data: {
      name: "Unauthorised Organisation",
    },
  });

  expect(response.status()).toBe(401);

  const body = await response.json();

  expect(body.error).toBe("Authentication required");
});
