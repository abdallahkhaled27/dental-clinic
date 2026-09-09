import { services } from "@/lib/clinic-data";

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-5xl px-6 py-20">
      <div className="max-w-xl">
        <h2 className="text-sm font-medium tracking-wide text-primary uppercase">
          What we offer
        </h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-balance">
          Our Services
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold">{service.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
