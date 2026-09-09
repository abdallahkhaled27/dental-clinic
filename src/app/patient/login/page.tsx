import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyPatientSession } from "@/lib/patient-auth";
import PatientLoginForm from "@/components/PatientLoginForm";

export const metadata: Metadata = {
  title: "Patient Login | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function PatientLoginPage() {
  const session = await verifyPatientSession();
  if (session) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-bold tracking-tight">Patient Login</h1>
      <p className="mt-2 text-sm opacity-70">
        Sign in to manage your appointments.
      </p>
      <div className="mt-8">
        <PatientLoginForm />
      </div>
    </main>
  );
}
