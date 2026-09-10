import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BookingForm from "@/components/BookingForm";
import { getDentists } from "@/lib/dentists";
import { verifyPatientSession } from "@/lib/patient-auth";

export const metadata: Metadata = {
  title: "Book an Appointment | Bright Smile Dental",
};

// The dentist list now comes from the database (see schema.prisma) rather
// than static code, so this page needs a live DB connection per request —
// same reasoning as the admin page's `force-dynamic`.
export const dynamic = "force-dynamic";

export default async function BookPage() {
  // proxy.ts already redirects signed-out visitors before the request
  // reaches here — this is the second, independent check directly in
  // front of the page itself (same belt-and-suspenders pattern as /admin).
  const session = await verifyPatientSession();
  if (!session) {
    redirect("/login?next=/book");
  }

  const dentists = await getDentists();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-balance">
        Book an Appointment
      </h1>
      <p className="mt-2 text-muted-foreground">
        Fill out the form below and we&apos;ll confirm your appointment
        shortly.
      </p>
      <div className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <BookingForm
          dentists={dentists}
          defaultName={session.name}
          defaultEmail={session.email}
        />
      </div>
    </main>
  );
}
