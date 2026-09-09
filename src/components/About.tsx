import { clinicInfo } from "@/lib/clinic-data";

export default function About() {
  return (
    <section id="about" className="border-y border-border bg-foreground/[0.02]">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-sm font-medium tracking-wide text-primary uppercase">
          Who we are
        </h2>
        <p className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-balance">
          About Us
        </p>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground">
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
