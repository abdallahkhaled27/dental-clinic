import { clinicInfo, hours } from "@/lib/clinic-data";

export default function ContactHours() {
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
