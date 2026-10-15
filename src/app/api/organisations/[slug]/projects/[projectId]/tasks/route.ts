import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordActivity } from "@/lib/activity";
import { parseProjectBody } from "@/lib/project-access";
import {
  assigneeBelongsToOrganisation,
  getTaskProjectAccess,
  parseTaskDate,
} from "@/lib/task-access";
import {
  canManageTasks,
  canReadTasks,
} from "@/lib/task-permissions";
import { createTaskSchema } from "@/lib/validation/task";

type Context = {
  params: Promise<{
    slug: string;
    projectId: string;
  }>;
};

async function authorise(context: Context) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "Authentication required",
      status: 401,
    } as const;
  }

  const { slug, projectId } = await context.params;

  const access = await getTaskProjectAccess(
    slug,
    projectId,
    session.user.id,
  );

  if (!access) {
    return {
      error: "Project not found",
      status: 404,
    } as const;
  }

  return { access } as const;
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

  if (!canReadTasks(result.access.membership.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId: result.access.project.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      assigneeId: true,
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    tasks,
    project: result.access.project,
    currentUserRole: result.access.membership.role,
  });
}

export async function POST(
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

  if (!canManageTasks(result.access.membership.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  if (result.access.project.status === "ARCHIVED") {
    return NextResponse.json(
      { error: "Cannot create tasks in an archived project" },
      { status: 409 },
    );
  }

  const body = await parseProjectBody(request);

  if (!body.ok) {
    return NextResponse.json(
      { error: body.error },
      { status: body.status },
    );
  }

  const parsed = createTaskSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid task information" },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if (
    data.assigneeId &&
    !(await assigneeBelongsToOrganisation(
      data.assigneeId,
      result.access.membership.organisationId,
    ))
  ) {
    return NextResponse.json(
      { error: "Assignee must belong to this organisation" },
      { status: 400 },
    );
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "TODO",
        priority: data.priority ?? "MEDIUM",
        dueDate: parseTaskDate(data.dueDate) ?? null,
        assigneeId: data.assigneeId ?? null,
        projectId: result.access.project.id,
      },
    });

    await recordActivity({
      organisationId: result.access.membership.organisationId,
      actorId: result.access.actorId,
      action: "TASK_CREATED",
      entityType: "TASK",
      entityId: task.id,
      summary: `Created task "${task.title}"`,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create task" },
      { status: 500 },
    );
  }
}
