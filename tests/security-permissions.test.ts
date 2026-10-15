import { describe, expect, it } from "vitest";

import {
  canManageProjects,
} from "../src/lib/project-permissions";

import {
  canManageTasks,
  canReadTasks,
} from "../src/lib/task-permissions";

describe("role-based access control", () => {
  it("allows owners to manage projects", () => {
    expect(canManageProjects("OWNER")).toBe(true);
  });

  it("allows administrators to manage projects", () => {
    expect(canManageProjects("ADMIN")).toBe(true);
  });

  it("prevents members from managing projects", () => {
    expect(canManageProjects("MEMBER")).toBe(false);
  });

  it("rejects unknown project roles", () => {
    expect(canManageProjects("UNKNOWN")).toBe(false);
  });

  it("allows owners to manage tasks", () => {
    expect(canManageTasks("OWNER")).toBe(true);
  });

  it("allows administrators to manage tasks", () => {
    expect(canManageTasks("ADMIN")).toBe(true);
  });

  it("prevents members from managing tasks", () => {
    expect(canManageTasks("MEMBER")).toBe(false);
  });

  it("allows members to read tasks", () => {
    expect(canReadTasks("MEMBER")).toBe(true);
  });

  it("allows owners and administrators to read tasks", () => {
    expect(canReadTasks("OWNER")).toBe(true);
    expect(canReadTasks("ADMIN")).toBe(true);
  });

  it("rejects unknown roles", () => {
    expect(canReadTasks("UNKNOWN")).toBe(false);
    expect(canManageTasks("UNKNOWN")).toBe(false);
  });
});
