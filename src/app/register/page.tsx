"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RegistrationErrors = {
  name?: string[];
  email?: string[];
  password?: string[];
};

export default function RegisterPage() {
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hydrated || loading) return;

    setError("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setFieldErrors({
        password: ["Passwords do not match."],
      });
      return;
    }

    if (password.length < 12) {
      setFieldErrors({
        password: ["Password must contain at least 12 characters."],
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.fields) {
          setFieldErrors(result.fields);
        }

        setError(result.error ?? "Registration failed.");
        return;
      }

      router.replace("/login");
    } catch {
      setError("Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold">
          Create your Collavryn account
        </h1>

        <p className="mb-8 text-slate-400">
          Start organising your work with your team.
        </p>

        <form method="post" onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Full name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />

            {fieldErrors.name?.map((message) => (
              <p key={message} role="alert" className="mt-2 text-sm text-red-400">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />

            {fieldErrors.email?.map((message) => (
              <p key={message} role="alert" className="mt-2 text-sm text-red-400">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />

            {fieldErrors.password?.map((message) => (
              <p key={message} role="alert" className="mt-2 text-sm text-red-400">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium"
            >
              Confirm password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!hydrated || loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
