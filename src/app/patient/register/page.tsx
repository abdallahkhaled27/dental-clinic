import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyPatientSession } from "@/lib/patient-auth";
import PatientRegisterForm from "@/components/PatientRegisterForm";

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
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
      <p className="mt-2 text-sm opacity-70">
        Sign up to manage your appointments.
      </p>
      <div className="mt-8">
        <PatientRegisterForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
