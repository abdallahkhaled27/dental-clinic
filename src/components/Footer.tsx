import { getTranslations } from "next-intl/server";
import { clinicInfo } from "@/lib/clinic-data";

export default async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {clinicInfo.name}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
