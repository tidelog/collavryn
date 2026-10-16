import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Organise your workspace",
    description:
      "Bring your team together with shared organisations, clear membership roles, and one place for your work.",
  },
  {
    number: "02",
    title: "Keep projects moving",
    description:
      "Create projects, track their progress, and give every initiative a home.",
  },
  {
    number: "03",
    title: "Make work visible",
    description:
      "Manage tasks, follow activity, and stay aligned as projects evolve.",
  },
];

const previewTasks = [
  {
    title: "Design the onboarding flow",
    project: "Platform",
    status: "In progress",
    statusClass: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  },
  {
    title: "Review workspace permissions",
    project: "Platform",
    status: "Done",
    statusClass: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  },
  {
    title: "Prepare the next release",
    project: "Website",
    status: "To do",
    statusClass: "bg-white/5 text-zinc-400 ring-white/10",
  },
];

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return diagonal ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path
        d="M5 19 19 5M8 5h11v11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path
        d="M4 12h16m-6-6 6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          fill="none"
          className="h-6 w-6"
        >
          <path
            d="M10 9.5 5 16l5 6.5M22 9.5l5 6.5-5 6.5M18.5 7l-5 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-xl font-semibold tracking-tight text-white">
        collavryn<span className="text-indigo-400">.</span>
      </span>
    </Link>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="absolute -inset-5 rounded-[2rem] bg-indigo-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#10131d] text-left shadow-2xl shadow-black/50">
        <div className="flex h-12 items-center gap-2 border-b border-white/10 bg-[#151825] px-5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#fb6a68]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#f4bf50]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#5bc886]" />
          <span className="ml-4 text-xs text-zinc-500">
            Collavryn / Workspace
          </span>
        </div>

        <div className="grid min-h-[390px] md:grid-cols-[210px_1fr]">
          <aside className="hidden border-r border-white/10 bg-[#121521] p-5 md:block">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-sm font-bold text-indigo-300">
                S
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-100">
                  Studio Workspace
                </div>
                <div className="text-xs text-zinc-500">Team overview</div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="rounded-lg bg-indigo-500/15 px-3 py-2.5 font-medium text-indigo-300">
                Overview
              </div>
              <div className="px-3 py-2.5 text-zinc-500">Projects</div>
              <div className="px-3 py-2.5 text-zinc-500">Members</div>
            </div>

            <div className="mt-12 border-t border-white/10 pt-5 text-xs text-zinc-600">
              Your team, in sync.
            </div>
          </aside>

          <div className="p-5 sm:p-7">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-indigo-300">
                  Workspace overview
                </div>
                <h3 className="text-xl font-semibold text-white sm:text-2xl">
                  Good morning, team.
                </h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Here&apos;s what your workspace is working on.
                </p>
              </div>
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
                Example workspace
              </span>
            </div>

            <div className="mb-7 grid grid-cols-3 gap-3">
              {[
                { label: "Projects", value: "06", detail: "Active workspace" },
                { label: "Tasks", value: "24", detail: "Across projects" },
                { label: "Members", value: "08", detail: "Collaborating" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-4"
                >
                  <div className="text-xs text-zinc-500">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {item.value}
                  </div>
                  <div className="mt-1 hidden text-[11px] text-zinc-600 sm:block">
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="text-sm font-medium text-white">
                  Recent tasks
                </span>
                <span className="text-xs text-indigo-300">Team activity</span>
              </div>

              {previewTasks.map((task) => (
                <div
                  key={task.title}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-4 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs text-zinc-400">
                      ✓
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200">
                        {task.title}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {task.project}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ${task.statusClass}`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-zinc-600">
        Illustrative workspace preview. No live customer data shown.
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#090b12] font-sans text-zinc-100 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[650px] overflow-hidden">
        <div className="absolute left-1/2 top-[-420px] h-[760px] w-[850px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.07]">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-6 sm:px-10">
          <Brand />

          <div className="flex items-center gap-3 sm:gap-6">
            <a
              href="#features"
              className="hidden text-sm text-zinc-400 transition hover:text-white sm:inline"
            >
              Features
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#11131d] transition hover:bg-indigo-100"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-7xl px-6 pb-16 pt-20 text-center sm:px-10 sm:pt-28 lg:pt-36">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-4 py-2 text-xs font-medium text-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            A clearer way to work together
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.08] tracking-[-0.055em] text-white sm:text-6xl lg:text-[82px]">
            Great work happens
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
              together.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
            One thoughtfully organised space for your team, projects,
            and tasks. Less time figuring out what&apos;s happening.
            More time making things happen.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 sm:w-auto"
            >
              Create your workspace
              <ArrowIcon />
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] sm:w-auto"
            >
              Sign in
              <ArrowIcon diagonal />
            </Link>
          </div>

          <div className="mt-16 sm:mt-20">
            <ProductPreview />
          </div>
        </section>

        <section
          id="features"
          className="border-t border-white/[0.07] bg-[#0c0e17] px-6 py-24 sm:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                Built for collaboration
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Everything in its place.
                <br />
                Everyone on the same page.
              </h2>
              <p className="mt-5 text-base leading-8 text-zinc-400">
                From the first project to the final task, Collavryn
                makes it easier to organise the work that matters.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.number}
                  className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-7 transition hover:border-indigo-400/30"
                >
                  <div className="mb-10 font-mono text-sm text-indigo-400">
                    / {feature.number}
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Your next project starts here.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-8 text-zinc-400">
            Create an account, set up your organisation, and bring
            your projects together.
          </p>
          <Link
            href="/register"
            className="mt-9 inline-flex items-center gap-3 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#11131d] transition hover:bg-indigo-100"
          >
            Get started
            <ArrowIcon />
          </Link>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Brand />
          <p className="text-xs text-zinc-500">
            Organise better. Build together.
          </p>
          <div className="flex gap-5 text-sm text-zinc-400">
            <Link href="/login" className="hover:text-white">
              Log in
            </Link>
            <Link href="/register" className="hover:text-white">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
