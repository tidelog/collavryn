"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  assigneeId: string | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

type Member = {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

function TaskManagerContent() {
  const { slug, projectId } = useParams<{
    slug: string;
    projectId: string;
  }>();

  const workspace = `/organisations/${encodeURIComponent(slug)}`;
  const endpoint =
    `/api${workspace}/projects/${encodeURIComponent(projectId)}/tasks`;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [role, setRole] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = role === "OWNER" || role === "ADMIN";
  const canEdit = canManage && projectStatus !== "ARCHIVED";

  async function loadTasks() {
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Unable to load tasks or access denied");
    }

    const data = await response.json();

    setTasks(data.tasks);
    setRole(data.currentUserRole);
    setProjectName(data.project.name);
    setProjectStatus(data.project.status);
  }

  useEffect(() => {
    let active = true;

    Promise.all([
      fetch(endpoint, { cache: "no-store" }),
      fetch(`/api${workspace}/members`, { cache: "no-store" }),
    ])
      .then(async ([taskResponse, memberResponse]) => {
        if (!taskResponse.ok || !memberResponse.ok) {
          throw new Error("Unable to access this project");
        }

        const taskData = await taskResponse.json();
        const memberData = await memberResponse.json();

        if (!active) return;

        setTasks(taskData.tasks);
        setRole(taskData.currentUserRole);
        setProjectName(taskData.project.name);
        setProjectStatus(taskData.project.status);
        setMembers(memberData.members);
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
  }, [endpoint, workspace]);

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit || saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate: dueDate || null,
          assigneeId: assigneeId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create task");
      }

      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setAssigneeId("");

      await loadTasks();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unexpected error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(
    taskId: string,
    changes: Record<string, string | null>,
  ) {
    setError("");

    try {
      const response = await fetch(`${endpoint}/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update task");
      }

      await loadTasks();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unexpected error",
      );
    }
  }

  async function editText(
    task: Task,
    field: "title" | "description",
  ) {
    const current = field === "title"
      ? task.title
      : task.description || "";

    const value = window.prompt(
      field === "title" ? "Task title" : "Task description",
      current,
    );

    if (value === null) return;

    await updateTask(task.id, { [field]: value });
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}" permanently?`)) {
      return;
    }

    setError("");

    try {
      const response = await fetch(`${endpoint}/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete task");
      }

      await loadTasks();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unexpected error",
      );
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <header>
        <Link
          href={`${workspace}/projects`}
          className="text-sm underline"
        >
          Back to projects
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          {projectName || "Project tasks"}
        </h1>

        <p className="mt-2 text-sm opacity-70">
          Manage tasks, priorities, assignments, and deadlines.
        </p>

        {projectStatus === "ARCHIVED" && (
          <p className="mt-3 text-amber-600">
            This project is archived. Tasks are read-only.
          </p>
        )}
      </header>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {loading && <p>Loading tasks...</p>}

      {!loading && canEdit && (
        <form
          onSubmit={createTask}
          className="space-y-4 rounded-xl border p-5"
        >
          <h2 className="text-xl font-semibold">Create task</h2>

          <div>
            <label htmlFor="task-title" className="block text-sm">
              Task title
            </label>

            <input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={2}
              maxLength={150}
              className="mt-2 w-full rounded border p-3 text-black"
              placeholder="Implement user settings"
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm">
              Description
            </label>

            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={5000}
              className="mt-2 w-full rounded border p-3 text-black"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="task-priority" className="block text-sm">
                Priority
              </label>

              <select
                id="task-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value as "LOW" | "MEDIUM" | "HIGH",
                  )
                }
                className="mt-2 w-full rounded border p-3 text-black"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-assignee" className="block text-sm">
                Assignee
              </label>

              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                className="mt-2 w-full rounded border p-3 text-black"
              >
                <option value="">Unassigned</option>

                {members.map((member) => (
                  <option key={member.id} value={member.user.id}>
                    {member.user.name || member.user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-due-date" className="block text-sm">
                Due date
              </label>

              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-2 w-full rounded border p-3 text-black"
              />
            </div>
          </div>

          <button
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create task"}
          </button>
        </form>
      )}

      {!loading && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            Tasks ({tasks.length})
          </h2>

          {tasks.length === 0 && <p>No tasks yet.</p>}

          {tasks.map((task) => (
            <article
              key={task.id}
              className="space-y-4 rounded-xl border p-5"
            >
              <div>
                <h3 className="text-lg font-semibold">{task.title}</h3>

                <p className="mt-2 whitespace-pre-wrap text-sm opacity-75">
                  {task.description || "No description"}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs opacity-70">
                    Status
                  </label>

                  <select
                    aria-label={`Status for ${task.title}`}
                    value={task.status}
                    disabled={!canEdit}
                    onChange={(event) =>
                      void updateTask(task.id, {
                        status: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded border p-2 text-black disabled:opacity-60"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs opacity-70">
                    Priority
                  </label>

                  <select
                    aria-label={`Priority for ${task.title}`}
                    value={task.priority}
                    disabled={!canEdit}
                    onChange={(event) =>
                      void updateTask(task.id, {
                        priority: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded border p-2 text-black disabled:opacity-60"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs opacity-70">
                    Due date
                  </label>

                  <input
                    type="date"
                    aria-label={`Due date for ${task.title}`}
                    value={task.dueDate?.slice(0, 10) || ""}
                    disabled={!canEdit}
                    onChange={(event) =>
                      void updateTask(task.id, {
                        dueDate: event.target.value || null,
                      })
                    }
                    className="mt-1 w-full rounded border p-2 text-black disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs opacity-70">
                  Assigned to
                </label>

                <select
                  aria-label={`Assignee for ${task.title}`}
                  value={task.assigneeId || ""}
                  disabled={!canEdit}
                  onChange={(event) =>
                    void updateTask(task.id, {
                      assigneeId: event.target.value || null,
                    })
                  }
                  className="mt-1 w-full rounded border p-2 text-black disabled:opacity-60"
                >
                  <option value="">Unassigned</option>

                  {members.map((member) => (
                    <option key={member.id} value={member.user.id}>
                      {member.user.name || member.user.email}
                    </option>
                  ))}
                </select>
              </div>

              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void editText(task, "title")}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Edit title
                  </button>

                  <button
                    type="button"
                    onClick={() => void editText(task, "description")}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Edit description
                  </button>

                  <button
                    type="button"
                    onClick={() => void deleteTask(task)}
                    className="rounded border border-red-500 px-3 py-2 text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default function TaskManagerPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl p-8">
          Loading task manager...
        </main>
      }
    >
      <TaskManagerContent />
    </Suspense>
  );
}
