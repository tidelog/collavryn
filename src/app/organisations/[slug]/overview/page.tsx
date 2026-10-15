"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Overview = {
  organisation: {
    name: string;
    slug: string;
  };
  summary: {
    members: number;
    projects: {
      total: number;
      active: number;
      archived: number;
    };
    tasks: {
      total: number;
      todo: number;
      inProgress: number;
      completed: number;
      overdue: number;
      upcoming: number;
    };
    completionRate: number;
  };
  projects: {
    id: string;
    name: string;
    status: string;
    taskCount: number;
    completedCount: number;
  }[];
  upcomingTasks: {
    id: string;
    title: string;
    priority: string;
    dueDate: string | null;
    project: {
      id: string;
      name: string;
    };
  }[];
  activity: {
    id: string;
    action: string;
    summary: string;
    createdAt: string;
    actor: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }[];
};

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-xl border p-5">
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}

function OverviewContent() {
  const { slug } = useParams<{ slug: string }>();

  const workspace =
    `/organisations/${encodeURIComponent(slug)}`;

  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`/api${workspace}/overview`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to access workspace dashboard");
        }

        return response.json();
      })
      .then((data: Overview) => {
        if (active) setOverview(data);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [workspace]);

  if (loading) {
    return <main className="p-8">Loading dashboard...</main>;
  }

  if (error || !overview) {
    return (
      <main className="p-8">
        <p role="alert">{error || "Dashboard unavailable"}</p>
      </main>
    );
  }

  const { summary } = overview;

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-8">
      <header>
        <Link href={workspace} className="text-sm underline">
          Back to workspace
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          {overview.organisation.name}
        </h1>

        <p className="mt-2 opacity-70">
          Workspace dashboard and activity
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          Workspace metrics
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Members" value={summary.members} />
          <Metric label="Total projects" value={summary.projects.total} />
          <Metric label="Active projects" value={summary.projects.active} />
          <Metric label="Archived projects" value={summary.projects.archived} />
          <Metric label="Total tasks" value={summary.tasks.total} />
          <Metric label="To do" value={summary.tasks.todo} />
          <Metric label="In progress" value={summary.tasks.inProgress} />
          <Metric label="Completed" value={summary.tasks.completed} />
          <Metric label="Overdue" value={summary.tasks.overdue} />
          <Metric label="Due this week" value={summary.tasks.upcoming} />
          <Metric
            label="Completion rate"
            value={`${summary.completionRate}%`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Project progress
          </h2>

          <Link
            href={`${workspace}/projects`}
            className="text-sm text-blue-600 underline"
          >
            Manage projects
          </Link>
        </div>

        {overview.projects.length === 0 && (
          <p>No projects created yet.</p>
        )}

        {overview.projects.map((project) => {
          const percent = project.taskCount
            ? Math.round(
                (project.completedCount / project.taskCount) * 100,
              )
            : 0;

          return (
            <article
              key={project.id}
              className="rounded-xl border p-5"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>

                  <p className="text-sm opacity-70">
                    {project.status} · {project.completedCount}/
                    {project.taskCount} tasks completed
                  </p>
                </div>

                <span>{percent}%</span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded bg-gray-200">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <Link
                href={`${workspace}/projects/${project.id}/tasks`}
                className="mt-3 inline-block text-sm text-blue-600 underline"
              >
                View tasks
              </Link>
            </article>
          );
        })}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Upcoming deadlines
        </h2>

        {overview.upcomingTasks.length === 0 && (
          <p>No upcoming deadlines.</p>
        )}

        {overview.upcomingTasks.map((task) => (
          <article
            key={task.id}
            className="rounded-xl border p-4"
          >
            <p className="font-semibold">{task.title}</p>

            <p className="mt-1 text-sm opacity-70">
              {task.project.name} · {task.priority} priority
            </p>

            <p className="mt-1 text-sm">
              Due {task.dueDate?.slice(0, 10)}
            </p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Recent activity
        </h2>

        {overview.activity.length === 0 && (
          <p>No activity recorded yet.</p>
        )}

        {overview.activity.map((event) => (
          <article
            key={event.id}
            className="rounded-xl border p-4"
          >
            <p>{event.summary}</p>

            <p className="mt-2 text-xs opacity-60">
              {event.actor?.name ||
                event.actor?.email ||
                "Former member"}
              {" · "}
              {new Date(event.createdAt).toLocaleString()}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default function WorkspaceOverviewPage() {
  return (
    <Suspense fallback={<main className="p-8">Loading...</main>}>
      <OverviewContent />
    </Suspense>
  );
}
