import { getTranslations } from "next-intl/server";
import { clinicInfo } from "@/lib/clinic-data";
import { Link } from "@/i18n/navigation";

export default async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,var(--primary),transparent)] opacity-[0.08]"
      />
      <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          {clinicInfo.name}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          {t("tagline")}
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          {t("intro", { clinicName: clinicInfo.name })}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/book"
            className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            {t("bookAppointment")}
          </Link>
          <Link
            href="/#services"
            className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            {t("viewServices")}
          </Link>
        </div>
      </div>
    </section>
  );
}
