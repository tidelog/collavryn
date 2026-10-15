import { expect, test } from "@playwright/test";

test("workspace endpoints reject unauthenticated users", async ({ request }) => {
  const slug = "nonexistent-test-workspace";
  const memberId = "00000000-0000-4000-8000-000000000000";

  const listResponse = await request.get("/api/organisations");
  expect(listResponse.status()).toBe(401);

  const membersResponse = await request.get(
    `/api/organisations/${slug}/members`,
  );
  expect(membersResponse.status()).toBe(401);

  const addResponse = await request.post(
    `/api/organisations/${slug}/members`,
    { data: { email: "test@example.com" } },
  );
  expect(addResponse.status()).toBe(401);

  const removeResponse = await request.delete(
    `/api/organisations/${slug}/members/${memberId}`,
  );
  expect(removeResponse.status()).toBe(401);
});
