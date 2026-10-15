import { describe, expect, it } from "vitest";

import {
  createTaskSchema,
  updateTaskSchema,
} from "../src/lib/validation/task";

import {
  canManageTasks,
  canReadTasks,
} from "../src/lib/task-permissions";

describe("task creation", () => {
  it("accepts a valid task", () => {
    expect(
      createTaskSchema.safeParse({
        title: "Implement authentication",
        description: "Add secure login",
        priority: "HIGH",
        status: "TODO",
        dueDate: "2026-12-15",
      }).success,
    ).toBe(true);
  });

  it("rejects short titles", () => {
    expect(
      createTaskSchema.safeParse({
        title: "A",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid priorities", () => {
    expect(
      createTaskSchema.safeParse({
        title: "Test task",
        priority: "CRITICAL",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid statuses", () => {
    expect(
      createTaskSchema.safeParse({
        title: "Test task",
        status: "CANCELLED",
      }).success,
    ).toBe(false);
  });

  it("rejects organisation overrides", () => {
    expect(
      createTaskSchema.safeParse({
        title: "Test task",
        organisationId: "another-workspace",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid assignee IDs", () => {
    expect(
      createTaskSchema.safeParse({
        title: "Test task",
        assigneeId: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid dates", () => {
    expect(
      createTaskSchema.safeParse({
        title: "Test task",
        dueDate: "2026-99-99",
      }).success,
    ).toBe(false);
  });
});

describe("task updates", () => {
  it("accepts status changes", () => {
    expect(
      updateTaskSchema.safeParse({
        status: "DONE",
      }).success,
    ).toBe(true);
  });

  it("allows clearing an assignment", () => {
    expect(
      updateTaskSchema.safeParse({
        assigneeId: null,
      }).success,
    ).toBe(true);
  });

  it("allows clearing a due date", () => {
    expect(
      updateTaskSchema.safeParse({
        dueDate: null,
      }).success,
    ).toBe(true);
  });

  it("rejects empty updates", () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
  });
});

describe("task permissions", () => {
  it("allows members to read tasks", () => {
    expect(canReadTasks("MEMBER")).toBe(true);
  });

  it("allows owners to manage tasks", () => {
    expect(canManageTasks("OWNER")).toBe(true);
  });

  it("allows admins to manage tasks", () => {
    expect(canManageTasks("ADMIN")).toBe(true);
  });

  it("prevents members from managing tasks", () => {
    expect(canManageTasks("MEMBER")).toBe(false);
  });

  it("rejects unknown roles", () => {
    expect(canManageTasks("UNKNOWN")).toBe(false);
    expect(canReadTasks("UNKNOWN")).toBe(false);
  });
});
