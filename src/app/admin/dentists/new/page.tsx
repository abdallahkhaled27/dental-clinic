import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import DentistForm from "@/components/DentistForm";

export const metadata: Metadata = {
  title: "Add Dentist | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function NewDentistPage() {
  const session = await verifySession();
  if (!session) {
    redirect("/admin/login?next=/admin");
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link
        href="/admin"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Add Dentist</h1>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <DentistForm />
      </div>
    </main>
  );
}
