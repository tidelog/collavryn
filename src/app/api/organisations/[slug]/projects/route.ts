import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  canManageProjects,
  getProjectAccess,
  parseProjectBody,
} from "@/lib/project-access";
import { createProjectSchema } from "@/lib/validation/project";

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: Request,
  context: Context,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { slug } = await context.params;

  const access = await getProjectAccess(slug, session.user.id);

  if (!access) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  if (status && !["ACTIVE", "ARCHIVED"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid project status" },
      { status: 400 },
    );
  }

  const projects = await prisma.project.findMany({
    where: {
      organisationId: access.organisationId,
      ...(status
        ? { status: status as "ACTIVE" | "ARCHIVED" }
        : {}),
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    projects,
    currentUserRole: access.role,
  });
}

export async function POST(
  request: Request,
  context: Context,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { slug } = await context.params;

  const access = await getProjectAccess(slug, session.user.id);

  if (!access) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 },
    );
  }

  if (!canManageProjects(access.role)) {
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

  const parsed = createProjectSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid project information" },
      { status: 400 },
    );
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        organisationId: access.organisationId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create project" },
      { status: 500 },
    );
  }
}
