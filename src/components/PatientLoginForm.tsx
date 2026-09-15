"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { fieldClass, labelClass, primaryButtonClass } from "@/lib/ui";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";

type Status = "idle" | "submitting" | "error";

// redirectTo is a logical, locale-free path (see the contract note on the
// login page) — the locale-aware router here adds the right prefix
// itself, so this must stay next-intl's useRouter, not next/navigation's.
export default function PatientLoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const t = useTranslations("Auth");
  const tCommon = useTranslations("Common");

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
        setErrorMessage(data.error ?? tCommon("genericError"));
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage(tCommon("networkError"));
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          disabled={isSubmitting}
          className={fieldClass}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={labelClass}>
            {t("passwordLabel")}
          </label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          disabled={isSubmitting}
          className={fieldClass}
        />
      </div>

      {status === "error" && <ErrorBanner message={errorMessage} />}

      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? t("signingIn") : t("signIn")}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link
          href={`/register?next=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-primary hover:underline"
        >
          {t("signUp")}
        </Link>
      </p>
    </form>
  );
}
