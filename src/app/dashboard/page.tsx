import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";

async function DashboardContent() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-blue-400">
              Authenticated workspace
            </p>

            <h1 className="text-3xl font-bold">
              Welcome to Collavryn
            </h1>
          </div>

          <form
            action={async () => {
              "use server";

              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Sign out
            </button>
          </form>
        </div>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Your account
          </h2>

          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-slate-400">
                Name
              </dt>

              <dd className="mt-1">
                {session.user.name ?? "Not provided"}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">
                Email
              </dt>

              <dd className="mt-1">
                {session.user.email}
              </dd>
            </div>

            <div>
              <dt className="text-sm text-slate-400">
                User ID
              </dt>

              <dd className="mt-1 break-all font-mono text-sm">
                {session.user.id}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <p role="status" className="text-slate-400">
            Loading your dashboard...
          </p>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
