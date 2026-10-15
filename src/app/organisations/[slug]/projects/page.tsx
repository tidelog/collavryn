"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
};

function ProjectsContent() {
  const { slug } = useParams<{ slug: string }>();

  const endpoint =
    `/api/organisations/${encodeURIComponent(slug)}/projects`;

  const [projects, setProjects] = useState<Project[]>([]);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canManage = role === "OWNER" || role === "ADMIN";

  async function loadProjects(selectedFilter = filter) {
    const response = await fetch(
      `${endpoint}?status=${selectedFilter}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "Workspace not found or access denied"
          : "Unable to load projects",
      );
    }

    const data = await response.json();

    setProjects(data.projects);
    setRole(data.currentUserRole);
  }

  useEffect(() => {
    let active = true;

    fetch(`${endpoint}?status=${filter}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Workspace not found or access denied");
        }

        const data = await response.json();

        if (active) {
          setProjects(data.projects);
          setRole(data.currentUserRole);
        }
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
  }, [endpoint, filter]);

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create project");
      }

      setName("");
      setDescription("");
      setFilter("ACTIVE");
      await loadProjects("ACTIVE");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unexpected error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateProject(
    project: Project,
    operation: "rename" | "archive" | "restore" | "delete",
  ) {
    setError("");

    let method = "PATCH";
    let body: Record<string, string> | undefined;

    if (operation === "rename") {
      const nextName = window.prompt("Project name", project.name);

      if (nextName === null) return;

      body = { name: nextName };
    } else if (operation === "archive") {
      body = { status: "ARCHIVED" };
    } else if (operation === "restore") {
      body = { status: "ACTIVE" };
    } else {
      if (!window.confirm(`Permanently delete "${project.name}"?`)) {
        return;
      }

      method = "DELETE";
    }

    try {
      const response = await fetch(`${endpoint}/${project.id}`, {
        method,
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update project");
      }

      await loadProjects();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unexpected error",
      );
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <header>
        <Link
          href={`/organisations/${encodeURIComponent(slug)}`}
          className="text-sm underline"
        >
          Back to workspace
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Projects</h1>

        <p className="mt-2 text-sm opacity-70">
          Manage your workspace projects.
        </p>
      </header>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {loading && <p>Loading projects...</p>}

      {!loading && canManage && (
        <form
          onSubmit={createProject}
          className="space-y-4 rounded-xl border p-5"
        >
          <h2 className="text-xl font-semibold">New project</h2>

          <div>
            <label htmlFor="project-name" className="block text-sm">
              Project name
            </label>

            <input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              minLength={2}
              maxLength={100}
              className="mt-2 w-full rounded border p-3 text-black"
              placeholder="Website redesign"
            />
          </div>

          <div>
            <label htmlFor="project-description" className="block text-sm">
              Description
            </label>

            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={3}
              className="mt-2 w-full rounded border p-3 text-black"
              placeholder="What are we building?"
            />
          </div>

          <button
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create project"}
          </button>
        </form>
      )}

      {!loading && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Workspace projects</h2>

            <select
              aria-label="Project status filter"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as "ACTIVE" | "ARCHIVED")
              }
              className="rounded border p-2 text-black"
            >
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {projects.length === 0 && (
            <p>No {filter.toLowerCase()} projects yet.</p>
          )}

          {projects.map((project) => (
            <article
              key={project.id}
              className="space-y-3 rounded-xl border p-5"
            >
              <div>
                <h3 className="text-lg font-semibold">{project.name}</h3>

                <Link
                  href={`/organisations/${encodeURIComponent(slug)}/projects/${project.id}/tasks`}
                  className="mt-3 inline-block text-sm text-blue-600 underline"
                >
                  Manage tasks
                </Link>

                <p className="text-sm opacity-70">
                  {project.description || "No description"}
                </p>

                <p className="mt-2 text-xs opacity-60">
                  {project.status}
                </p>
              </div>

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void updateProject(project, "rename")}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Rename
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void updateProject(
                        project,
                        project.status === "ACTIVE"
                          ? "archive"
                          : "restore",
                      )
                    }
                    className="rounded border px-3 py-2 text-sm"
                  >
                    {project.status === "ACTIVE"
                      ? "Archive"
                      : "Restore"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void updateProject(project, "delete")}
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

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl p-8">
          Loading projects...
        </main>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
