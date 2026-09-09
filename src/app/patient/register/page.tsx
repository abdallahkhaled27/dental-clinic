import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyPatientSession } from "@/lib/patient-auth";
import PatientRegisterForm from "@/components/PatientRegisterForm";

export const metadata: Metadata = {
  title: "Create Account | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function PatientRegisterPage() {
  const session = await verifyPatientSession();
  if (session) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
      <p className="mt-2 text-sm opacity-70">
        Sign up to manage your appointments.
      </p>
      <div className="mt-8">
        <PatientRegisterForm />
      </div>
    </main>
  );
}
