import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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
import { updateTaskSchema } from "@/lib/validation/task";

type Context = {
  params: Promise<{
    slug: string;
    projectId: string;
    taskId: string;
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

  const { slug, projectId, taskId } = await context.params;

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

  return { access, taskId } as const;
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

  const task = await prisma.task.findFirst({
    where: {
      id: result.taskId,
      projectId: result.access.project.id,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ task });
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

  if (!canManageTasks(result.access.membership.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  if (result.access.project.status === "ARCHIVED") {
    return NextResponse.json(
      { error: "Archived projects are read-only" },
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

  const parsed = updateTaskSchema.safeParse(body.value);

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

  const changed = await prisma.task.updateMany({
    where: {
      id: result.taskId,
      projectId: result.access.project.id,
    },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined
        ? { priority: data.priority }
        : {}),
      ...(data.assigneeId !== undefined
        ? { assigneeId: data.assigneeId }
        : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: parseTaskDate(data.dueDate) }
        : {}),
    },
  });

  if (changed.count !== 1) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 },
    );
  }

  const task = await prisma.task.findFirst({
    where: {
      id: result.taskId,
      projectId: result.access.project.id,
    },
  });

  return NextResponse.json({ task });
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

  if (!canManageTasks(result.access.membership.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 },
    );
  }

  const deleted = await prisma.task.deleteMany({
    where: {
      id: result.taskId,
      projectId: result.access.project.id,
    },
  });

  if (deleted.count !== 1) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
