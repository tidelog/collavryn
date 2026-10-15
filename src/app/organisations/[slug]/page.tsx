"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Member = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

function OrganisationWorkspaceContent() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [members, setMembers] = useState<Member[]>([]);
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const endpoint = `/api/organisations/${encodeURIComponent(slug)}/members`;

  async function refresh() {
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? "Workspace not found or access denied"
          : "Unable to load members",
      );
    }

    const data = await response.json();
    setMembers(data.members);
    setRole(data.currentUserRole);
  }

  useEffect(() => {
    let active = true;

    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Workspace not found or access denied");
        const data = await response.json();
        if (active) {
          setMembers(data.members);
          setRole(data.currentUserRole);
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [endpoint]);

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newMemberRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to add member");
      }

      setEmail("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unexpected error");
    }
  }

  async function changeMember(memberId: string, method: "PATCH" | "DELETE", nextRole?: string) {
    setError("");

    try {
      const response = await fetch(`${endpoint}/${memberId}`, {
        method,
        ...(method === "PATCH"
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role: nextRole }),
            }
          : {}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to update member");
      }

      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unexpected error");
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <Link className="text-sm underline" href="/organisations">
        Back to organisations
      </Link>
      <header>
        <h1 className="text-3xl font-bold">Workspace</h1>
        <p className="mt-2 text-sm opacity-70">
          {slug} · Your role: {role || "Unknown"}
        </p>
      </header>

      {error && <p role="alert" className="text-red-600">{error}</p>}
      {loading && <p>Loading workspace...</p>}

      {!loading && ["OWNER", "ADMIN"].includes(role) && (
        <form onSubmit={addMember} className="space-y-3 rounded-xl border p-5">
          <h2 className="text-xl font-semibold">Add an existing user</h2>
          <p className="text-sm opacity-70">
            The user must already have a Collavryn account.
          </p>
          <input
            aria-label="Member email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="member@example.com"
            className="w-full rounded border p-3 text-black"
          />
          {role === "OWNER" && (
            <select
              aria-label="New member role"
              value={newMemberRole}
              onChange={(event) => setNewMemberRole(event.target.value as "MEMBER" | "ADMIN")}
              className="rounded border p-2 text-black"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}
          <button className="rounded bg-blue-600 px-4 py-2 text-white">
            Add member
          </button>
        </form>
      )}

      {!loading && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Team members</h2>
          {members.map((member) => (
            <div key={member.id} className="rounded-xl border p-4">
              <p className="font-semibold">{member.user.name || member.user.email}</p>
              <p className="text-sm opacity-70">{member.user.email}</p>
              <p className="mt-1 text-sm">Role: {member.role}</p>

              {role === "OWNER" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    aria-label={`Role for ${member.user.email}`}
                    value={member.role}
                    onChange={(event) =>
                      void changeMember(member.id, "PATCH", event.target.value)
                    }
                    className="rounded border p-2 text-black"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Remove this member from the workspace?")) {
                        void changeMember(member.id, "DELETE");
                      }
                    }}
                    className="rounded border border-red-500 px-3 py-2 text-red-600"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}


export default function OrganisationWorkspacePage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-3xl p-8">
        <p>Loading workspace...</p>
      </main>
    }>
      <OrganisationWorkspaceContent />
    </Suspense>
  );
}
