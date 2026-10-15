import { expect, test } from "@playwright/test";

test("task endpoints reject unauthenticated requests", async ({
  request,
}) => {
  const base =
    "/api/organisations/unknown/projects/" +
    "00000000-0000-4000-8000-000000000000/tasks";

  const taskId = "00000000-0000-4000-8000-000000000001";

  expect((await request.get(base)).status()).toBe(401);

  expect(
    (
      await request.post(base, {
        data: { title: "Unauthorised Task" },
      })
    ).status(),
  ).toBe(401);

  expect(
    (await request.get(`${base}/${taskId}`)).status(),
  ).toBe(401);

  expect(
    (
      await request.patch(`${base}/${taskId}`, {
        data: { status: "DONE" },
      })
    ).status(),
  ).toBe(401);

  expect(
    (await request.delete(`${base}/${taskId}`)).status(),
  ).toBe(401);
});
