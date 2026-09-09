import Link from "next/link";
import { clinicInfo } from "@/lib/clinic-data";

export default function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {clinicInfo.tagline}
      </h1>
      <p className="mx-auto mt-4 max-w-xl opacity-70">
        {clinicInfo.name} combines friendly care with modern dentistry.
        Book your visit today and let us take care of your smile.
      </p>
      <Link
        href="/book"
        className="mt-8 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
      >
        Book Appointment
      </Link>
    </section>
  );
}
