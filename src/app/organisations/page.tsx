"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Organisation = {
  id: string;
  name: string;
  slug: string;
  memberships: { role: string }[];
  _count: { memberships: number };
};

export default function OrganisationsPage() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [unauthenticated, setUnauthenticated] = useState(false);

  async function loadOrganisations() {
    const response = await fetch("/api/organisations", {
      cache: "no-store",
    });

    if (response.status === 401) {
      setUnauthenticated(true);
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to load organisations");
    }

    const data = await response.json();
    setOrganisations(data.organisations);
  }

  useEffect(() => {
    let active = true;

    fetch("/api/organisations", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (response.status === 401) {
          setUnauthenticated(true);
          return;
        }
        if (!response.ok) throw new Error("Unable to load organisations");
        const data = await response.json();
        if (active) setOrganisations(data.organisations);
      })
      .catch(() => {
        if (active) setError("Unable to load organisations");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  async function createOrganisation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/organisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Unable to create organisation");
      }

      setName("");
      await loadOrganisations();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  if (unauthenticated) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p>Please sign in to access your organisations.</p>
        <Link className="underline" href="/login">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <header>
        <Link className="text-sm underline" href="/dashboard">
          Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Your organisations</h1>
        <p className="mt-2 text-sm opacity-70">
          Create workspaces and collaborate with your team.
        </p>
      </header>

      <form onSubmit={createOrganisation} className="space-y-3 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Create organisation</h2>
        <label htmlFor="organisation-name" className="block text-sm">
          Organisation name
        </label>
        <input
          id="organisation-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          minLength={2}
          maxLength={100}
          required
          className="w-full rounded border p-3 text-black"
          placeholder="Engineering team"
        />
        <button
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create organisation"}
        </button>
      </form>

      {error && <p role="alert" className="text-red-600">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Workspaces</h2>
        {loading && <p>Loading...</p>}
        {!loading && organisations.length === 0 && (
          <p>No organisations yet. Create your first workspace above.</p>
        )}
        {organisations.map((organisation) => (
          <Link
            key={organisation.id}
            href={`/organisations/${encodeURIComponent(organisation.slug)}`}
            className="block rounded-xl border p-5 hover:bg-gray-500/10"
          >
            <span className="font-semibold">{organisation.name}</span>
            <span className="ml-3 text-sm opacity-70">
              {organisation.memberships[0]?.role} · {organisation._count.memberships} members
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
