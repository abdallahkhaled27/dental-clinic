import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import KnowledgeForm from "@/components/KnowledgeForm";

export const metadata: Metadata = {
  title: "Add Knowledge Base Entry | Bright Smile Dental",
};

export const dynamic = "force-dynamic";

export default async function NewKnowledgeEntryPage() {
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

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Add Knowledge Base Entry</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The chatbot draws on this to answer patient questions — write it the way you&apos;d
        want a patient to hear it.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <KnowledgeForm />
      </div>
    </main>
  );
}
