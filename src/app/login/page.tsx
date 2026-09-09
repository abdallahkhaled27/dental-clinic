import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Staff Login | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Already signed in? No reason to show the form again.
  const session = await verifySession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-bold tracking-tight">Staff Login</h1>
      <p className="mt-2 text-sm opacity-70">
        For clinic staff only. Contact an administrator if you need access.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </main>
  );
}
