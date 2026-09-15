import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import ContactHours from "@/components/ContactHours";
import StructuredData from "@/components/StructuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.home" });
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    // hreflang — tells Google the English and Arabic pages are the same
    // content in different languages, not duplicates or unrelated pages.
    // Relative paths resolve against metadataBase (see app/layout.tsx).
    alternates: {
      languages: { en: "/", ar: "/ar" },
    },
    openGraph: {
      title,
      description,
      url: locale === "ar" ? "/ar" : "/",
      siteName: "Bright Smile Dental",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      type: "website",
    },
  };
}

export default function Home() {
  return (
    <main>
      <StructuredData />
      <Hero />
      <Services />
      <About />
      <ContactHours />
    </main>
  );
}
