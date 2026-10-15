import { describe, expect, it } from "vitest";

import {
  createProjectSchema,
  updateProjectSchema,
} from "../src/lib/validation/project";
import { canManageProjects } from "../src/lib/project-permissions";

describe("project validation", () => {
  it("accepts a valid project", () => {
    const result = createProjectSchema.safeParse({
      name: "Engineering",
      description: "Backend services",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a project name that is too short", () => {
    const result = createProjectSchema.safeParse({
      name: "A",
    });

    expect(result.success).toBe(false);
  });

  it("rejects unexpected organisation overrides", () => {
    const result = createProjectSchema.safeParse({
      name: "Engineering",
      organisationId: "another-organisation",
    });

    expect(result.success).toBe(false);
  });

  it("accepts project archiving", () => {
    const result = updateProjectSchema.safeParse({
      status: "ARCHIVED",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid project status", () => {
    const result = updateProjectSchema.safeParse({
      status: "DELETED",
    });

    expect(result.success).toBe(false);
  });

  it("rejects empty updates", () => {
    expect(updateProjectSchema.safeParse({}).success).toBe(false);
  });
});

describe("project permissions", () => {
  it("allows owners to manage projects", () => {
    expect(canManageProjects("OWNER")).toBe(true);
  });

  it("allows admins to manage projects", () => {
    expect(canManageProjects("ADMIN")).toBe(true);
  });

  it("prevents members from managing projects", () => {
    expect(canManageProjects("MEMBER")).toBe(false);
  });
});
