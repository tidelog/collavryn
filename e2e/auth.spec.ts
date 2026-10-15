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


    const projectsEndpoint =
      `/api/organisations/${organisationResult.organisation.slug}/projects`;

    const invalidProject = await page.request.post(projectsEndpoint, {
      data: {
        name: "Invalid",
        organisationId: "00000000-0000-4000-8000-000000000000",
      },
    });

    expect(invalidProject.status()).toBe(400);

    const createProject = await page.request.post(projectsEndpoint, {
      data: {
        name: "Browser Test Project",
        description: "Automated project lifecycle test",
      },
    });

    expect(createProject.status()).toBe(201);

    const createdProject = (await createProject.json()).project;

    expect(createdProject.name).toBe("Browser Test Project");
    expect(createdProject.status).toBe("ACTIVE");

    const projectEndpoint =
      `${projectsEndpoint}/${createdProject.id}`;

    const listProjects = await page.request.get(projectsEndpoint);
    expect(listProjects.status()).toBe(200);

    const projectList = await listProjects.json();

    expect(
      projectList.projects.some(
        (project: { id: string }) =>
          project.id === createdProject.id,
      ),
    ).toBe(true);

    const viewProject = await page.request.get(projectEndpoint);
    expect(viewProject.status()).toBe(200);

    const updateProject = await page.request.patch(projectEndpoint, {
      data: {
        name: "Updated Browser Test Project",
        description: "Updated description",
      },
    });

    expect(updateProject.status()).toBe(200);
    expect((await updateProject.json()).project.name).toBe(
      "Updated Browser Test Project",
    );

    const archiveProject = await page.request.patch(projectEndpoint, {
      data: { status: "ARCHIVED" },
    });

    expect(archiveProject.status()).toBe(200);

    const archivedList = await page.request.get(
      `${projectsEndpoint}?status=ARCHIVED`,
    );

    expect(archivedList.status()).toBe(200);

    expect(
      (await archivedList.json()).projects.some(
        (project: { id: string }) =>
          project.id === createdProject.id,
      ),
    ).toBe(true);

    const restoreProject = await page.request.patch(projectEndpoint, {
      data: { status: "ACTIVE" },
    });

    expect(restoreProject.status()).toBe(200);


    const tasksEndpoint = `${projectEndpoint}/tasks`;

    const invalidTask = await page.request.post(tasksEndpoint, {
      data: {
        title: "Invalid task",
        organisationId: "00000000-0000-4000-8000-000000000000",
      },
    });

    expect(invalidTask.status()).toBe(400);

    const invalidAssignee = await page.request.post(tasksEndpoint, {
      data: {
        title: "Invalid assignee",
        assigneeId: "00000000-0000-4000-8000-000000000000",
      },
    });

    expect(invalidAssignee.status()).toBe(400);

    const createTask = await page.request.post(tasksEndpoint, {
      data: {
        title: "Browser Test Task",
        description: "Task lifecycle test",
        status: "TODO",
        priority: "HIGH",
        dueDate: "2026-12-15",
      },
    });

    expect(createTask.status()).toBe(201);

    const task = (await createTask.json()).task;

    expect(task.title).toBe("Browser Test Task");
    expect(task.status).toBe("TODO");
    expect(task.priority).toBe("HIGH");

    const taskEndpoint = `${tasksEndpoint}/${task.id}`;

    const listTasks = await page.request.get(tasksEndpoint);

    expect(listTasks.status()).toBe(200);

    expect(
      (await listTasks.json()).tasks.some(
        (item: { id: string }) => item.id === task.id,
      ),
    ).toBe(true);

    const viewTask = await page.request.get(taskEndpoint);

    expect(viewTask.status()).toBe(200);

    const updateTask = await page.request.patch(taskEndpoint, {
      data: {
        title: "Updated Browser Test Task",
        status: "IN_PROGRESS",
        priority: "LOW",
      },
    });

    expect(updateTask.status()).toBe(200);

    const updatedTask = (await updateTask.json()).task;

    expect(updatedTask.title).toBe("Updated Browser Test Task");
    expect(updatedTask.status).toBe("IN_PROGRESS");
    expect(updatedTask.priority).toBe("LOW");

    const finishTask = await page.request.patch(taskEndpoint, {
      data: { status: "DONE" },
    });

    expect(finishTask.status()).toBe(200);

    const archiveBeforeDelete = await page.request.patch(
      projectEndpoint,
      { data: { status: "ARCHIVED" } },
    );

    expect(archiveBeforeDelete.status()).toBe(200);

    const archivedTaskWrite = await page.request.patch(taskEndpoint, {
      data: { title: "Should fail" },
    });

    expect(archivedTaskWrite.status()).toBe(409);

    const archivedTaskRead = await page.request.get(taskEndpoint);

    expect(archivedTaskRead.status()).toBe(200);

    const restoreBeforeDelete = await page.request.patch(
      projectEndpoint,
      { data: { status: "ACTIVE" } },
    );

    expect(restoreBeforeDelete.status()).toBe(200);

    const deleteTask = await page.request.delete(taskEndpoint);

    expect(deleteTask.status()).toBe(200);

    const deletedTask = await page.request.get(taskEndpoint);

    expect(deletedTask.status()).toBe(404);

    const overviewResponse = await page.request.get(
      `/api/organisations/${organisationResult.organisation.slug}/overview`,
    );

    expect(overviewResponse.status()).toBe(200);

    const overview = await overviewResponse.json();

    expect(overview.summary.projects.total).toBeGreaterThanOrEqual(1);
    expect(overview.summary.members).toBeGreaterThanOrEqual(1);
    expect(overview.summary.tasks.total).toBeGreaterThanOrEqual(0);

    const actions = overview.activity.map(
      (event: { action: string }) => event.action,
    );

    expect(actions).toContain("PROJECT_CREATED");
    expect(actions).toContain("TASK_CREATED");
    expect(actions).toContain("TASK_UPDATED");
    expect(actions).toContain("TASK_DELETED");

    console.log("PASS: Workspace dashboard and activity tracking");
    console.log("PASS: Task lifecycle");
    console.log("PASS: Task validation and assignee restrictions");
    console.log("PASS: Archived project task protection");

    const deleteProject = await page.request.delete(projectEndpoint);
    expect(deleteProject.status()).toBe(200);

    const deletedProject = await page.request.get(projectEndpoint);
    expect(deletedProject.status()).toBe(404);

    console.log("PASS: Project lifecycle");

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
