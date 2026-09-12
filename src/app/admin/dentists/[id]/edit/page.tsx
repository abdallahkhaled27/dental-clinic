import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getDentistById } from "@/lib/dentists";
import DentistForm from "@/components/DentistForm";

export const metadata: Metadata = {
  title: "Edit Dentist | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function EditDentistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  if (!session) {
    redirect("/admin/login?next=/admin");
  }

  const { id } = await params;
  const dentist = await getDentistById(id);

  if (!dentist) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link
        href="/admin"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Edit Dentist</h1>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <DentistForm
          dentistId={dentist.id}
          defaultName={dentist.name}
          defaultSpecialty={dentist.specialty}
        />
      </div>
    </main>
  );
}
