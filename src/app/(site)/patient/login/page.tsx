import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyPatientSession } from "@/lib/patient-auth";
import PatientLoginForm from "@/components/PatientLoginForm";

export const metadata: Metadata = {
  title: "Patient Login | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function PatientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only ever redirect within our own site — an unvalidated `next` value
  // could otherwise be used to bounce a signed-in patient off to an
  // attacker-controlled URL.
  const redirectTo = next?.startsWith("/") ? next : "/patient/dashboard";

  const session = await verifyPatientSession();
  if (session) {
    redirect(redirectTo);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-sm items-center px-6 py-16">
      <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">Patient Login</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage your appointments.
        </p>
        <div className="mt-8">
          <PatientLoginForm redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}
