import type { Metadata } from "next";
import BookingForm from "@/components/BookingForm";

export const metadata: Metadata = {
  title: "Book an Appointment | Bright Smile Dental",
};

export default function BookPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        Book an Appointment
      </h1>
      <p className="mt-2 opacity-70">
        Fill out the form below and we&apos;ll confirm your appointment
        shortly.
      </p>
      <div className="mt-10">
        <BookingForm />
      </div>
    </main>
  );
}
