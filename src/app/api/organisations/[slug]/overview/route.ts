import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProjectAccess } from "@/lib/project-access";
import { calculateTaskMetrics } from "@/lib/dashboard-metrics";

type Context = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
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

  const membership = await getProjectAccess(
    slug,
    session.user.id,
  );

  if (!membership) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 },
    );
  }

  const organisationId = membership.organisationId;

  const [
    organisation,
    projects,
    tasks,
    activity,
    members,
  ] = await Promise.all([
    prisma.organisation.findUnique({
      where: { id: organisationId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),

    prisma.project.findMany({
      where: { organisationId },
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.task.findMany({
      where: {
        project: { organisationId },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.activityLog.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        summary: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),

    prisma.membership.count({
      where: { organisationId },
    }),
  ]);

  if (!organisation) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 },
    );
  }

  const metrics = calculateTaskMetrics(tasks);

  const taskCounts = new Map<
    string,
    { total: number; completed: number }
  >();

  for (const task of tasks) {
    const projectId = task.project.id;

    const count = taskCounts.get(projectId) ?? {
      total: 0,
      completed: 0,
    };

    count.total += 1;

    if (task.status === "DONE") {
      count.completed += 1;
    }

    taskCounts.set(projectId, count);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const upcomingTasks = tasks
    .filter(
      (task) =>
        task.status !== "DONE" &&
        task.dueDate !== null &&
        task.dueDate >= today,
    )
    .sort(
      (a, b) =>
        (a.dueDate?.getTime() ?? 0) -
        (b.dueDate?.getTime() ?? 0),
    )
    .slice(0, 10);

  return NextResponse.json({
    organisation,
    role: membership.role,

    summary: {
      members,
      projects: {
        total: projects.length,
        active: projects.filter(
          (project) => project.status === "ACTIVE",
        ).length,
        archived: projects.filter(
          (project) => project.status === "ARCHIVED",
        ).length,
      },
      tasks: metrics,
      completionRate:
        metrics.total === 0
          ? 0
          : Math.round(
              (metrics.completed / metrics.total) * 100,
            ),
    },

    projects: projects.map((project) => ({
      ...project,
      taskCount: taskCounts.get(project.id)?.total ?? 0,
      completedCount: taskCounts.get(project.id)?.completed ?? 0,
    })),

    upcomingTasks,
    activity,
  });
}
