import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyPatientSession } from "@/lib/patient-auth";
import PatientRegisterForm from "@/components/PatientRegisterForm";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export const metadata: Metadata = {
  title: "Create Account | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function PatientRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // See the identical check on the login page for why this is validated.
  const redirectTo = next?.startsWith("/") ? next : "/patient/dashboard";

  const session = await verifyPatientSession();
  if (session) {
    redirect(redirectTo);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up to manage your appointments.
        </p>
        <div className="mt-8">
          <GoogleSignInButton redirectTo={redirectTo} />
        </div>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>
        <PatientRegisterForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
