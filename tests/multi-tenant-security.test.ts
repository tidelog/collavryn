import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  membershipFindFirst: vi.fn(),
  projectFindFirst: vi.fn(),
  membershipFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    membership: {
      findFirst: mocks.membershipFindFirst,
      findUnique: mocks.membershipFindUnique,
    },
    project: {
      findFirst: mocks.projectFindFirst,
    },
  },
}));

import { getProjectAccess } from "../src/lib/project-access";

import {
  getTaskProjectAccess,
  assigneeBelongsToOrganisation,
} from "../src/lib/task-access";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

const organisationA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const organisationB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const projectA = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const projectB = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const memberships = [
  {
    userId: userA,
    organisationId: organisationA,
    role: "OWNER",
    slug: "workspace-a",
  },
  {
    userId: userB,
    organisationId: organisationB,
    role: "OWNER",
    slug: "workspace-b",
  },
];

const projects = [
  {
    id: projectA,
    organisationId: organisationA,
    name: "Project A",
    status: "ACTIVE",
  },
  {
    id: projectB,
    organisationId: organisationB,
    name: "Project B",
    status: "ACTIVE",
  },
];

describe("multi-tenant data isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.membershipFindFirst.mockImplementation(
      async ({ where }: {
        where: {
          userId: string;
          organisation: { slug: string };
        };
      }) => {
        const membership = memberships.find(
          (item) =>
            item.userId === where.userId &&
            item.slug === where.organisation.slug,
        );

        if (!membership) return null;

        return {
          organisationId: membership.organisationId,
          role: membership.role,
        };
      },
    );

    mocks.projectFindFirst.mockImplementation(
      async ({ where }: {
        where: {
          id: string;
          organisationId: string;
        };
      }) => {
        return (
          projects.find(
            (project) =>
              project.id === where.id &&
              project.organisationId === where.organisationId,
          ) ?? null
        );
      },
    );

    mocks.membershipFindUnique.mockImplementation(
      async ({ where }: {
        where: {
          userId_organisationId: {
            userId: string;
            organisationId: string;
          };
        };
      }) => {
        const { userId, organisationId } =
          where.userId_organisationId;

        const membership = memberships.find(
          (item) =>
            item.userId === userId &&
            item.organisationId === organisationId,
        );

        return membership ? { id: "membership-id" } : null;
      },
    );
  });

  it("allows user A into their own organisation", async () => {
    const access = await getProjectAccess(
      "workspace-a",
      userA,
    );

    expect(access?.organisationId).toBe(organisationA);
  });

  it("allows user B into their own organisation", async () => {
    const access = await getProjectAccess(
      "workspace-b",
      userB,
    );

    expect(access?.organisationId).toBe(organisationB);
  });

  it("denies user A access to organisation B", async () => {
    const access = await getProjectAccess(
      "workspace-b",
      userA,
    );

    expect(access).toBeNull();
  });

  it("denies user B access to organisation A", async () => {
    const access = await getProjectAccess(
      "workspace-a",
      userB,
    );

    expect(access).toBeNull();
  });

  it("allows a user to access a project in their workspace", async () => {
    const access = await getTaskProjectAccess(
      "workspace-a",
      projectA,
      userA,
    );

    expect(access?.project.id).toBe(projectA);
    expect(access?.actorId).toBe(userA);
  });

  it("rejects a project belonging to another workspace", async () => {
    const access = await getTaskProjectAccess(
      "workspace-a",
      projectB,
      userA,
    );

    expect(access).toBeNull();
  });

  it("rejects another user's workspace and project", async () => {
    const access = await getTaskProjectAccess(
      "workspace-b",
      projectB,
      userA,
    );

    expect(access).toBeNull();
  });

  it("scopes project queries to the authenticated organisation", async () => {
    await getTaskProjectAccess(
      "workspace-a",
      projectB,
      userA,
    );

    expect(mocks.projectFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: projectB,
          organisationId: organisationA,
        },
      }),
    );
  });

  it("allows assigning an existing member", async () => {
    const allowed = await assigneeBelongsToOrganisation(
      userA,
      organisationA,
    );

    expect(allowed).toBe(true);
  });

  it("rejects assigning a user from another organisation", async () => {
    const allowed = await assigneeBelongsToOrganisation(
      userB,
      organisationA,
    );

    expect(allowed).toBe(false);
  });

  it("rejects assigning an unknown user", async () => {
    const allowed = await assigneeBelongsToOrganisation(
      "33333333-3333-4333-8333-333333333333",
      organisationA,
    );

    expect(allowed).toBe(false);
  });

  it("checks membership using both user and organisation IDs", async () => {
    await assigneeBelongsToOrganisation(
      userB,
      organisationA,
    );

    expect(mocks.membershipFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_organisationId: {
            userId: userB,
            organisationId: organisationA,
          },
        },
      }),
    );
  });
});
