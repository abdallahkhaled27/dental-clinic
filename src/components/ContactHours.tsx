import { clinicInfo, hours } from "@/lib/clinic-data";

export default function ContactHours() {
  return (
    <section id="contact" className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid gap-12 sm:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <dl className="mt-4 space-y-2 text-sm opacity-70">
            <div>
              <dt className="inline font-medium opacity-100">Phone: </dt>
              <dd className="inline">{clinicInfo.phone}</dd>
            </div>
            <div>
              <dt className="inline font-medium opacity-100">Email: </dt>
              <dd className="inline">{clinicInfo.email}</dd>
            </div>
            <div>
              <dt className="inline font-medium opacity-100">Address: </dt>
              <dd className="inline">{clinicInfo.address}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="text-2xl font-semibold">Hours</h2>
          <dl className="mt-4 space-y-2 text-sm opacity-70">
            {hours.map((entry) => (
              <div key={entry.day} className="flex justify-between">
                <dt>{entry.day}</dt>
                <dd>{entry.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
