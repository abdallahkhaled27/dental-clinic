import { getTranslations } from "next-intl/server";
import { clinicInfo } from "@/lib/clinic-data";
import { Link } from "@/i18n/navigation";
import PatientNavLink from "./PatientNavLink";
import MobileMenu from "./MobileMenu";

export default async function Header() {
  const t = await getTranslations("Nav");

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {clinicInfo.name}
        </Link>

        <nav className="hidden items-center gap-8 text-sm sm:flex">
          <Link href="/#services" className="text-foreground/80 transition-colors hover:text-foreground">
            {t("services")}
          </Link>
          <Link href="/#about" className="text-foreground/80 transition-colors hover:text-foreground">
            {t("about")}
          </Link>
          <Link href="/#contact" className="text-foreground/80 transition-colors hover:text-foreground">
            {t("contact")}
          </Link>
        </nav>

        <div className="hidden items-center gap-6 sm:flex">
          <PatientNavLink />
          <Link
            href="/book"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
          >
            {t("bookAppointment")}
          </Link>
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
