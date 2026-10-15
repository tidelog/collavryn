import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageProjects,
  getProjectAccess,
  parseProjectBody,
} from "@/lib/project-access";
import { updateProjectSchema } from "@/lib/validation/project";

type Context = {
  params: Promise<{
    slug: string;
    projectId: string;
  }>;
};

async function authorise(context: Context) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Authentication required", status: 401 } as const;
  }

  const { slug, projectId } = await context.params;

  const access = await getProjectAccess(slug, session.user.id);

  if (!access) {
    return { error: "Workspace not found", status: 404 } as const;
  }

  return { access, projectId } as const;
}

export async function GET(
  _request: Request,
  context: Context,
) {
  const result = await authorise(context);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id: result.projectId,
      organisationId: result.access.organisationId,
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    project,
    currentUserRole: result.access.role,
  });
}

export async function PATCH(
  request: Request,
  context: Context,
) {
  const result = await authorise(context);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  if (!canManageProjects(result.access.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const body = await parseProjectBody(request);

  if (!body.ok) {
    return NextResponse.json(
      { error: body.error },
      { status: body.status },
    );
  }

  const parsed = updateProjectSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project information" },
      { status: 400 },
    );
  }

  const existing = await prisma.project.findFirst({
    where: {
      id: result.projectId,
      organisationId: result.access.organisationId,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  const changed = await prisma.project.updateMany({
    where: {
      id: result.projectId,
      organisationId: result.access.organisationId,
    },
    data: parsed.data,
  });

  if (changed.count !== 1) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id: result.projectId,
      organisationId: result.access.organisationId,
    },
  });

  return NextResponse.json({ project });
}

export async function DELETE(
  _request: Request,
  context: Context,
) {
  const result = await authorise(context);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  if (!canManageProjects(result.access.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const deleted = await prisma.project.deleteMany({
    where: {
      id: result.projectId,
      organisationId: result.access.organisationId,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
