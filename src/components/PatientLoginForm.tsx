"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "submitting" | "error";

export default function PatientLoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      const response = await fetch("/api/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Couldn't reach the server. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm opacity-70">
        Don&apos;t have an account?{" "}
        <Link
          href={`/patient/register?next=${encodeURIComponent(redirectTo)}`}
          className="underline hover:opacity-70"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
