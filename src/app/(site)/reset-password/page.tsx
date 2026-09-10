import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password | Bright Smile Dental",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        {token ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a new password for your account.
            </p>
            <div className="mt-8">
              <ResetPasswordForm token={token} />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            This link is missing its reset token. Request a new one from the{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              forgot password
            </Link>{" "}
            page.
          </p>
        )}
      </div>
    </main>
  );
}
