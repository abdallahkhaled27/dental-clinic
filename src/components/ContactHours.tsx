import { clinicInfo, hours } from "@/lib/clinic-data";

export default function ContactHours() {
  const whatsappHref = `https://wa.me/${clinicInfo.whatsapp}?text=${encodeURIComponent(
    `Hi ${clinicInfo.name}, I'd like to ask about an appointment.`,
  )}`;

  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid gap-10 sm:grid-cols-2 sm:gap-6">
        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{clinicInfo.phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{clinicInfo.email}</dd>
            </div>
            <div className="flex justify-between gap-4 text-right">
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-medium">{clinicInfo.address}</dd>
            </div>
          </dl>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12.041 2C6.51 2 2.02 6.489 2.02 12.02c0 1.884.517 3.647 1.417 5.156L2 22l4.947-1.418a9.972 9.972 0 004.94 1.318h.005c5.53 0 10.02-4.489 10.02-10.02C21.912 6.35 17.423 2 12.041 2zm0 18.148h-.004a8.13 8.13 0 01-4.146-1.135l-.297-.176-3.09.885.86-3.14-.193-.322a8.109 8.109 0 01-1.245-4.339c0-4.489 3.653-8.14 8.146-8.14 2.176 0 4.221.848 5.76 2.388a8.09 8.09 0 012.386 5.76c-.002 4.49-3.655 8.219-8.177 8.219z" />
            </svg>
            Chat on WhatsApp
          </a>
        </div>

        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Hours</h2>
          <dl className="mt-5 space-y-3 text-sm">
            {hours.map((entry) => (
              <div key={entry.day} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{entry.day}</dt>
                <dd className="font-medium">{entry.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
