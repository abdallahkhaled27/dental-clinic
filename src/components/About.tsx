import { getTranslations } from "next-intl/server";
import { clinicInfo } from "@/lib/clinic-data";

export default async function About() {
  const t = await getTranslations("About");

  return (
    <section id="about" className="border-y border-border bg-foreground/[0.02]">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-sm font-medium tracking-wide text-primary uppercase">
          {t("kicker")}
        </h2>
        <p className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-balance">
          {t("title")}
        </p>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground">
          {t("body", { clinicName: clinicInfo.name })}
        </p>
      </div>
    </section>
  );
}
