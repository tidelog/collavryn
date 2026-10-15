import { expect, test } from "@playwright/test";

test("project endpoints reject unauthenticated requests", async ({
  request,
}) => {
  const base = "/api/organisations/nonexistent-workspace/projects";
  const projectId = "00000000-0000-4000-8000-000000000000";

  expect((await request.get(base)).status()).toBe(401);

  expect(
    (
      await request.post(base, {
        data: { name: "Unauthorised Project" },
      })
    ).status(),
  ).toBe(401);

  expect(
    (await request.get(`${base}/${projectId}`)).status(),
  ).toBe(401);

  expect(
    (
      await request.patch(`${base}/${projectId}`, {
        data: { name: "Unauthorised update" },
      })
    ).status(),
  ).toBe(401);

  expect(
    (await request.delete(`${base}/${projectId}`)).status(),
  ).toBe(401);
});
