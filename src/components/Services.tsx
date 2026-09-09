import { services } from "@/lib/clinic-data";

export default function Services() {
  return (
    <section id="services" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-2xl font-semibold">Our Services</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-lg border border-black/10 p-6 dark:border-white/10"
          >
            <h3 className="font-medium">{service.name}</h3>
            <p className="mt-2 text-sm opacity-70">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
