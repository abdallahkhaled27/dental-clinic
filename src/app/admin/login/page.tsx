import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Staff Login | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only ever redirect within our own site — see the identical check on
  // the patient login page for why this is validated rather than trusted.
  const redirectTo = next?.startsWith("/") ? next : "/admin";

  // Already signed in? No reason to show the form again.
  const session = await verifySession();
  if (session) {
    redirect(redirectTo);
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Staff Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          For clinic staff only. Contact an administrator if you need access.
        </p>
        <div className="mt-8">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}
