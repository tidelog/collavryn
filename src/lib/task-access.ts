import { prisma } from "@/lib/prisma";
import { getProjectAccess } from "@/lib/project-access";

export async function getTaskProjectAccess(
  slug: string,
  projectId: string,
  userId: string,
) {
  const membership = await getProjectAccess(slug, userId);

  if (!membership) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organisationId: membership.organisationId,
    },
    select: {
      id: true,
      organisationId: true,
      name: true,
      status: true,
    },
  });

  if (!project) {
    return null;
  }

  return { membership, project };
}

export async function assigneeBelongsToOrganisation(
  assigneeId: string,
  organisationId: string,
) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organisationId: {
        userId: assigneeId,
        organisationId,
      },
    },
    select: { id: true },
  });

  return membership !== null;
}

export function parseTaskDate(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  return new Date(`${value}T00:00:00.000Z`);
}
