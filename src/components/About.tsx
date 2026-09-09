import { clinicInfo } from "@/lib/clinic-data";

export default function About() {
  return (
    <section
      id="about"
      className="border-y border-black/10 bg-black/[.02] dark:border-white/10 dark:bg-white/[.03]"
    >
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold">About Us</h2>
        <p className="mt-4 max-w-2xl opacity-70">
          At {clinicInfo.name}, we&apos;ve been caring for our community
          for over 15 years. Our team is dedicated to providing gentle,
          high-quality dental care in a comfortable environment, using
          modern techniques and equipment to keep your smile healthy at
          every stage of life.
        </p>
      </div>
    </section>
  );
}
